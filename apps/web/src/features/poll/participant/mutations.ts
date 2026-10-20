import "server-only";

import type { Prisma, VoteType } from "@rallly/database";
import { prisma } from "@rallly/database";
import { recordPollActivities } from "@/features/activity/mutations";
import { MAX_PARTICIPANTS } from "@/features/poll/constants";
import {
  attachParticipantToInvite,
  findPendingPollInvite,
} from "@/features/poll/invite/mutations";
import { revalidatePollPages } from "@/features/poll/mutations";
import { generateAccessToken, isPollOptionPast } from "@/features/poll/utils";
import type { SpaceTier } from "@/features/space/schema";
import { scheduleWebhookDispatch } from "@/features/webhook/mutations";

type WriteRefusal =
  | "notFound"
  | "closed"
  | "full"
  | "optionFull"
  | "tentativeVotesNotAllowed"
  | "optionPassed";

/**
 * A participant write refused for a known, expected reason (poll closed, option
 * full, …) rather than a bug. Caught at the boundary and turned into a typed
 * `{ ok: false, reason }` result by {@link refusal}; any other error propagates.
 */
class WriteRefusedError extends Error {
  constructor(public readonly reason: WriteRefusal) {
    super(reason);
  }
}

/**
 * Locks the poll row for the rest of the transaction and proves the poll
 * still accepts writes. The organizer's close, delete and settings
 * transitions update the same row, so under READ COMMITTED a check made
 * before the transaction could pass while one of them commits in between.
 * Bans live on the user rows and are checked by the caller before the
 * transaction: their writers do not take this lock, and a response that
 * lands during a ban is removed with the poll anyway.
 */
async function lockOpenPoll(tx: Prisma.TransactionClient, pollId: string) {
  const [poll] = await tx.$queryRaw<
    {
      status: string;
      deleted: boolean;
      allow_tentative_votes: boolean;
    }[]
  >`
    SELECT status, deleted, allow_tentative_votes
    FROM polls WHERE id = ${pollId} FOR UPDATE
  `;

  if (!poll || poll.deleted) {
    throw new WriteRefusedError("notFound");
  }

  // The voting window is the organizer's control, so it has to hold here
  // and not only in the client, which hides the form via
  // `canAddNewParticipant` and `canEditParticipant`.
  if (poll.status !== "open") {
    throw new WriteRefusedError("closed");
  }

  return { allowTentativeVotes: poll.allow_tentative_votes };
}

function assertTentativeVotesAllowed(
  allowTentativeVotes: boolean,
  votes: { type: VoteType }[],
) {
  if (!allowTentativeVotes && votes.some((vote) => vote.type === "ifNeedBe")) {
    throw new WriteRefusedError("tentativeVotesNotAllowed");
  }
}

/**
 * The response may have been deleted between the action's authorization and
 * this transaction. Every participant write takes the poll row lock first,
 * so a read under it is current for the rest of the transaction.
 */
async function assertParticipantInPoll(
  tx: Prisma.TransactionClient,
  participantId: string,
  pollId: string,
) {
  const participant = await tx.participant.findFirst({
    where: { id: participantId, pollId },
    select: {
      id: true,
      timeZone: true,
      votes: { select: { optionId: true, type: true } },
    },
  });

  if (!participant) {
    throw new WriteRefusedError("notFound");
  }

  return participant;
}

async function listValidOptionIds(
  tx: Prisma.TransactionClient,
  pollId: string,
) {
  const options = await tx.option.findMany({
    where: { pollId },
    select: { id: true, startTime: true, duration: true },
  });
  return new Map(options.map((option) => [option.id, option]));
}

/**
 * Refuses new or changed positive votes for expired options while preserving
 * unchanged historical votes and allowing participants to remove old votes.
 */
function assertNoNewPastVotes({
  votes,
  options,
  previousVotes = [],
  timeZone,
}: {
  votes: { optionId: string; type: VoteType }[];
  options: Map<string, { id: string; startTime: Date; duration: number }>;
  previousVotes?: { optionId: string; type: VoteType }[];
  timeZone?: string | null;
}) {
  const previousVoteByOption = new Map(
    previousVotes.map((vote) => [vote.optionId, vote.type]),
  );
  const now = new Date();

  if (
    votes.some(({ optionId, type }) => {
      const option = options.get(optionId);
      return (
        option &&
        type !== "no" &&
        previousVoteByOption.get(optionId) !== type &&
        isPollOptionPast({ option, now, timeZone })
      );
    })
  ) {
    throw new WriteRefusedError("optionPassed");
  }
}

/**
 * Enforces each option's `maxParticipants` cap on "yes" votes. For every capped
 * option the response says yes to, it counts the committed yes votes and refuses
 * with `optionFull` if a new yes would exceed the limit. The count runs under
 * the poll row lock the caller already holds, so a concurrent yes either lands
 * before this count sees it or waits and then fails its own check. Options in
 * `grandfatheredYesOptionIds` (a yes the participant already held) are skipped,
 * so editing an unrelated option can't strand an existing response at the cap.
 */
async function assertYesVoteCapacity(
  tx: Prisma.TransactionClient,
  pollId: string,
  votes: { optionId: string; type: VoteType }[],
  grandfatheredYesOptionIds: Set<string> = new Set(),
) {
  const optionIds = [
    ...new Set(
      votes.filter((vote) => vote.type === "yes").map((vote) => vote.optionId),
    ),
  ];

  if (optionIds.length === 0) {
    return;
  }

  const [options, yesCounts] = await Promise.all([
    tx.option.findMany({
      where: {
        pollId,
        id: { in: optionIds },
        maxParticipants: { not: null },
      },
      select: { id: true, maxParticipants: true },
    }),
    tx.vote.groupBy({
      by: ["optionId"],
      where: { pollId, optionId: { in: optionIds }, type: "yes" },
      _count: { _all: true },
    }),
  ]);
  const yesCountByOption = new Map(
    yesCounts.map((row) => [row.optionId, row._count._all]),
  );

  for (const option of options) {
    const limit = option.maxParticipants;
    // A yes the participant already held still fits even at the cap: editing
    // an unrelated option must not strand an existing response.
    if (!limit || grandfatheredYesOptionIds.has(option.id)) {
      continue;
    }
    if ((yesCountByOption.get(option.id) ?? 0) >= limit) {
      throw new WriteRefusedError("optionFull");
    }
  }
}

/**
 * Boundary handler: turns a {@link WriteRefusedError} into a typed
 * `{ ok: false, reason }` result and rethrows anything else as a real failure.
 */
function refusal(error: unknown) {
  if (error instanceof WriteRefusedError) {
    return { ok: false as const, reason: error.reason };
  }
  throw error;
}

export type AddParticipantResult =
  | {
      ok: true;
      participant: {
        id: string;
        name: string;
        email: string | null;
        note: string | null;
      };
      poll: {
        id: string;
        userId: string | null;
        title: string;
        allowTentativeVotes: boolean;
        aggregateResultsOnly: boolean;
        space: {
          id: string;
          tier: SpaceTier;
          showBranding: boolean;
          hideAttribution: boolean;
          primaryColor: string | null;
          image: string | null;
        } | null;
      };
      editToken: string;
      viaInvite: boolean;
      totalResponses: number;
    }
  | { ok: false; reason: WriteRefusal };

export async function addParticipant({
  pollId,
  userId,
  locale,
  name,
  email,
  note,
  timeZone,
  token,
  votes,
}: {
  pollId: string;
  userId: string;
  locale: string;
  name: string;
  email?: string;
  note?: string;
  timeZone?: string;
  token?: string;
  votes: { optionId: string; type: VoteType }[];
}): Promise<AddParticipantResult> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      user: { select: { banned: true } },
      space: { select: { owner: { select: { banned: true } } } },
    },
  });

  // A poll whose creator or space owner was banned never accepts responses.
  if (!poll || poll.user?.banned || poll.space?.owner.banned) {
    return { ok: false, reason: "notFound" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const { allowTentativeVotes } = await lockOpenPoll(tx, pollId);
      const validOptionIds = await listValidOptionIds(tx, pollId);
      const validVotes = votes.filter(({ optionId }) =>
        validOptionIds.has(optionId),
      );

      assertTentativeVotesAllowed(allowTentativeVotes, validVotes);
      assertNoNewPastVotes({
        votes: validVotes,
        options: validOptionIds,
        timeZone,
      });
      await assertYesVoteCapacity(tx, pollId, validVotes);

      // Counted under the lock so two responses cannot both pass at the cap.
      const participantCount = await tx.participant.count({
        where: { pollId },
      });

      if (participantCount >= MAX_PARTICIPANTS) {
        throw new WriteRefusedError("full");
      }

      // A response answering an emailed invite takes the invite's token, so
      // the link the invitee already holds names it.
      const invite = token
        ? await findPendingPollInvite(tx, { pollId, token })
        : null;
      const editToken = invite?.token ?? generateAccessToken();

      const participant = await tx.participant.create({
        data: {
          pollId,
          name,
          email,
          note,
          timeZone,
          token: editToken,
          userId,
          locale,
          votes: {
            createMany: {
              data: validVotes.map(({ optionId, type }) => ({
                pollId,
                optionId,
                type,
              })),
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          note: true,
          poll: {
            select: {
              id: true,
              userId: true,
              title: true,
              allowTentativeVotes: true,
              aggregateResultsOnly: true,
              space: {
                select: {
                  id: true,
                  tier: true,
                  showBranding: true,
                  hideAttribution: true,
                  primaryColor: true,
                  image: true,
                },
              },
            },
          },
        },
      });

      await recordPollActivities(tx, [
        {
          pollId,
          type: "response_created",
          userId,
          participantId: participant.id,
          payload: {
            name: participant.name,
            ...(participant.note && { note: participant.note }),
          },
        },
      ]);
      scheduleWebhookDispatch({ pollId: pollId });

      if (invite) {
        await attachParticipantToInvite(tx, {
          inviteId: invite.id,
          participantId: participant.id,
        });
      }

      const { poll, ...participantFields } = participant;

      return {
        participant: participantFields,
        poll,
        editToken,
        viaInvite: invite !== null,
        totalResponses: participantCount + 1,
      };
    });

    revalidatePollPages();

    return { ok: true, ...result };
  } catch (error) {
    return refusal(error);
  }
}

export type EditParticipantResult =
  | { ok: true }
  | { ok: false; reason: WriteRefusal };

export async function updateParticipantVotes({
  participantId,
  pollId,
  actorUserId,
  votes,
}: {
  participantId: string;
  pollId: string;
  actorUserId: string | undefined;
  votes: { optionId: string; type: VoteType }[];
}): Promise<EditParticipantResult> {
  try {
    await prisma.$transaction(async (tx) => {
      const { allowTentativeVotes } = await lockOpenPoll(tx, pollId);
      const previousParticipant = await assertParticipantInPoll(
        tx,
        participantId,
        pollId,
      );

      const validOptionIds = await listValidOptionIds(tx, pollId);
      const validVotes = votes.filter(({ optionId }) =>
        validOptionIds.has(optionId),
      );

      assertTentativeVotesAllowed(allowTentativeVotes, validVotes);
      assertNoNewPastVotes({
        votes: validVotes,
        options: validOptionIds,
        previousVotes: previousParticipant.votes,
        timeZone: previousParticipant.timeZone,
      });

      const previousYesOptionIds = new Set(
        previousParticipant.votes
          .filter((vote) => vote.type === "yes")
          .map((vote) => vote.optionId),
      );
      await assertYesVoteCapacity(tx, pollId, validVotes, previousYesOptionIds);

      await tx.vote.deleteMany({ where: { participantId } });

      await tx.vote.createMany({
        data: validVotes.map(({ optionId, type }) => ({
          optionId,
          type,
          pollId,
          participantId,
        })),
      });

      // Bump `updatedAt` so it reflects this vote change; the poll cleanup
      // job uses it to detect recent activity. An empty `data: {}` update is
      // a no-op for `@updatedAt`, so set it explicitly.
      const updatedParticipant = await tx.participant.update({
        where: { id: participantId },
        data: { updatedAt: new Date() },
        select: { name: true },
      });

      await recordPollActivities(tx, [
        {
          pollId,
          type: "response_updated",
          userId: actorUserId,
          participantId,
          payload: { name: updatedParticipant.name },
        },
      ]);
      scheduleWebhookDispatch({ pollId: pollId });
    });
  } catch (error) {
    return refusal(error);
  }

  revalidatePollPages();

  return { ok: true };
}

export async function renameParticipant({
  participantId,
  pollId,
  actorUserId,
  name,
}: {
  participantId: string;
  pollId: string;
  actorUserId: string | undefined;
  name: string;
}): Promise<EditParticipantResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await lockOpenPoll(tx, pollId);
      await assertParticipantInPoll(tx, participantId, pollId);

      await tx.participant.update({
        where: { id: participantId },
        data: { name },
        select: null,
      });

      await recordPollActivities(tx, [
        {
          pollId,
          type: "response_updated",
          userId: actorUserId,
          participantId,
          payload: { name },
        },
      ]);
      scheduleWebhookDispatch({ pollId: pollId });
    });
  } catch (error) {
    return refusal(error);
  }

  revalidatePollPages();

  return { ok: true };
}

export async function deleteParticipant({
  participantId,
  pollId,
  actorUserId,
}: {
  participantId: string;
  pollId: string;
  actorUserId: string | undefined;
}): Promise<EditParticipantResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await lockOpenPoll(tx, pollId);

      // Snapshot before the delete: the activity payload is the historical
      // record of the removed response, so it carries the name and votes.
      const snapshot = await tx.participant.findFirst({
        where: { id: participantId, pollId },
        select: {
          name: true,
          votes: {
            select: {
              optionId: true,
              type: true,
              option: { select: { startTime: true, duration: true } },
            },
          },
        },
      });

      if (!snapshot) {
        throw new WriteRefusedError("notFound");
      }

      // Hard delete: votes cascade, the invite's SetNull FK reverts it to
      // pending, and the response frees the token it took from that invite
      // so the next response through the same link can take it again. The
      // activity row above is the historical record.
      await tx.participant.delete({ where: { id: participantId } });

      await recordPollActivities(tx, [
        {
          pollId,
          type: "response_deleted",
          userId: actorUserId,
          participantId,
          payload: {
            name: snapshot.name,
            votes: snapshot.votes.map((vote) => ({
              optionId: vote.optionId,
              start: vote.option.startTime.toISOString(),
              duration: vote.option.duration,
              type: vote.type,
            })),
          },
        },
      ]);
      scheduleWebhookDispatch({ pollId: pollId });
    });
  } catch (error) {
    return refusal(error);
  }

  revalidatePollPages();

  return { ok: true };
}
