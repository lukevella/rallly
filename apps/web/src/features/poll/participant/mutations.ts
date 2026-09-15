import "server-only";

import type { Prisma, VoteType } from "@rallly/database";
import { prisma } from "@rallly/database";
import { recordPollActivities } from "@/features/poll/activity/mutations";
import { MAX_PARTICIPANTS } from "@/features/poll/constants";
import {
  attachParticipantToInvite,
  findPendingPollInvite,
} from "@/features/poll/invite/mutations";
import { generateAccessToken } from "@/features/poll/utils";
import type { SpaceTier } from "@/features/space/schema";

class TentativeVotesNotAllowedError extends Error {}

/**
 * Rejects new tentative votes when the poll no longer allows them, locking the
 * poll row for the rest of the transaction.
 *
 * The check runs inside the writing transaction and takes a lock the
 * organizer's disable transition also takes. Under READ COMMITTED a plain read
 * would let a vote that passed an earlier check land after the organizer had
 * already counted zero tentative votes, stranding one on a poll that no longer
 * accepts them.
 */
async function assertTentativeVotesAllowed(
  tx: Prisma.TransactionClient,
  pollId: string,
  votes: { type: VoteType }[],
) {
  if (!votes.some((vote) => vote.type === "ifNeedBe")) {
    return;
  }

  const [poll] = await tx.$queryRaw<{ allow_tentative_votes: boolean }[]>`
    SELECT allow_tentative_votes FROM polls WHERE id = ${pollId} FOR UPDATE
  `;

  if (!poll?.allow_tentative_votes) {
    throw new TentativeVotesNotAllowedError();
  }
}

async function listValidOptionIds(
  tx: Prisma.TransactionClient,
  pollId: string,
) {
  const options = await tx.option.findMany({
    where: { pollId },
    select: { id: true },
  });
  return new Set(options.map((option) => option.id));
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
  | {
      ok: false;
      reason: "notFound" | "closed" | "full" | "tentativeVotesNotAllowed";
    };

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
      status: true,
      deleted: true,
      user: { select: { banned: true } },
    },
  });

  // A deleted poll, or one whose creator was banned, never accepts
  // responses.
  if (!poll || poll.deleted || poll.user?.banned) {
    return { ok: false, reason: "notFound" };
  }

  // The voting window is the organizer's control, so it has to hold here
  // and not only in the client, which hides the form via
  // `canAddNewParticipant`.
  if (poll.status !== "open") {
    return { ok: false, reason: "closed" };
  }

  const participantCount = await prisma.participant.count({
    where: { pollId },
  });

  if (participantCount >= MAX_PARTICIPANTS) {
    return { ok: false, reason: "full" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const validOptionIds = await listValidOptionIds(tx, pollId);
      const validVotes = votes.filter(({ optionId }) =>
        validOptionIds.has(optionId),
      );

      await assertTentativeVotesAllowed(tx, pollId, validVotes);

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
          payload: { name: participant.name },
        },
      ]);

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
      };
    });

    return {
      ok: true,
      ...result,
      totalResponses: participantCount + 1,
    };
  } catch (error) {
    if (error instanceof TentativeVotesNotAllowedError) {
      return { ok: false, reason: "tentativeVotesNotAllowed" };
    }
    throw error;
  }
}

export type UpdateParticipantVotesResult =
  | { ok: true }
  | { ok: false; reason: "tentativeVotesNotAllowed" };

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
}): Promise<UpdateParticipantVotesResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await assertTentativeVotesAllowed(tx, pollId, votes);

      await tx.vote.deleteMany({ where: { participantId } });

      const validOptionIds = await listValidOptionIds(tx, pollId);
      const validVotes = votes.filter(({ optionId }) =>
        validOptionIds.has(optionId),
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
    });
  } catch (error) {
    if (error instanceof TentativeVotesNotAllowedError) {
      return { ok: false, reason: "tentativeVotesNotAllowed" };
    }
    throw error;
  }

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
}) {
  await prisma.$transaction(async (tx) => {
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
  });
}

export async function deleteParticipant({
  participantId,
  pollId,
  actorUserId,
}: {
  participantId: string;
  pollId: string;
  actorUserId: string | undefined;
}) {
  await prisma.$transaction(async (tx) => {
    // Snapshot before the delete: the activity payload is the historical
    // record of the removed response, so it carries the name and votes.
    const snapshot = await tx.participant.findUniqueOrThrow({
      where: { id: participantId },
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
  });
}
