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
import { generateAccessToken, isOptionPast } from "@/features/poll/utils";
import type { SpaceTier } from "@/features/space/schema";
import { scheduleWebhookDispatch } from "@/features/webhook/mutations";

type WriteRefusal =
  | "notFound"
  | "closed"
  | "full"
  | "tentativeVotesNotAllowed"
  | "pastOption";

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
async function lockOpenPoll(
  tx: Prisma.TransactionClient,
  pollId: string,
  votes: { type: VoteType }[],
) {
  const [poll] = await tx.$queryRaw<
    { status: string; deleted: boolean; allow_tentative_votes: boolean }[]
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

  if (
    !poll.allow_tentative_votes &&
    votes.some((vote) => vote.type === "ifNeedBe")
  ) {
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
    select: { id: true },
  });

  if (!participant) {
    throw new WriteRefusedError("notFound");
  }
}

/**
 * Splits the poll's options into those a response may still vote on and
 * those that have passed. The clock is the server's, never the caller's, so
 * a client cannot reopen a past date by lying about the time.
 */
async function listPollOptions(
  tx: Prisma.TransactionClient,
  pollId: string,
  now = new Date(),
) {
  const options = await tx.option.findMany({
    where: { pollId },
    select: { id: true, startTime: true, duration: true },
  });
  const openOptionIds = new Set<string>();
  const pastOptionIds = new Set<string>();
  for (const option of options) {
    (isOptionPast(option, now) ? pastOptionIds : openOptionIds).add(option.id);
  }
  return { openOptionIds, pastOptionIds };
}

/**
 * Refuses a write that would change the answer on a past option. The client
 * sends a vote for every option, "no" for those left untouched, so a vote
 * that matches what is stored (or "no" where nothing is) is not a change.
 * The client already locks past options; this is the guard behind it.
 */
function assertNoPastVoteChange(
  votes: { optionId: string; type: VoteType }[],
  pastOptionIds: Set<string>,
  storedVotes: Map<string, VoteType> = new Map(),
) {
  const changesPastVote = votes.some(
    ({ optionId, type }) =>
      pastOptionIds.has(optionId) &&
      type !== (storedVotes.get(optionId) ?? "no"),
  );

  if (changesPastVote) {
    throw new WriteRefusedError("pastOption");
  }
}

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
      const { openOptionIds, pastOptionIds } = await listPollOptions(
        tx,
        pollId,
      );
      const validVotes = votes.filter(({ optionId }) =>
        openOptionIds.has(optionId),
      );

      await lockOpenPoll(tx, pollId, validVotes);
      assertNoPastVoteChange(votes, pastOptionIds);

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
      await lockOpenPoll(tx, pollId, votes);
      await assertParticipantInPoll(tx, participantId, pollId);

      const { openOptionIds, pastOptionIds } = await listPollOptions(
        tx,
        pollId,
      );

      const pastVotes = await tx.vote.findMany({
        where: { participantId, optionId: { in: [...pastOptionIds] } },
        select: { optionId: true, type: true },
      });
      assertNoPastVoteChange(
        votes,
        pastOptionIds,
        new Map(pastVotes.map(({ optionId, type }) => [optionId, type])),
      );

      // Votes on past options are frozen: only the still-open ones are
      // replaced, so editing a response never drops what was said about a
      // date before it passed.
      await tx.vote.deleteMany({
        where: { participantId, optionId: { in: [...openOptionIds] } },
      });

      const validVotes = votes.filter(({ optionId }) =>
        openOptionIds.has(optionId),
      );

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
      const participant = await tx.participant.update({
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
          payload: { name: participant.name },
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
      await lockOpenPoll(tx, pollId, []);
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
      await lockOpenPoll(tx, pollId, []);

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
