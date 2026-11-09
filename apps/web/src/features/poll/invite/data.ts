import "server-only";

import { prisma } from "@rallly/database";
import type { BallotSource } from "./types";

/**
 * Non revoked invites for a poll, newest first. Revoked rows are kept in the
 * table so their tokens still resolve, but they have no UI surface here.
 * Callers prove poll access before calling.
 */
export async function listPollInvites({ pollId }: { pollId: string }) {
  return prisma.pollInvite.findMany({
    where: { pollId, revokedAt: null },
    select: {
      id: true,
      email: true,
      token: true,
      openedAt: true,
      participantId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * The poll as every viewer's ballot starts: settings, options and each
 * response's votes. Deliberately viewer independent and free of contact
 * details and tokens, so it can be cached and shared across requests.
 */
export async function getBallotSource({
  pollId,
}: {
  pollId: string;
}): Promise<BallotSource | null> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      id: true,
      status: true,
      timeZone: true,
      hideParticipants: true,
      hideScores: true,
      allowTentativeVotes: true,
      requireParticipantEmail: true,
      deleted: true,
      options: {
        select: { id: true, startTime: true, duration: true },
        orderBy: { startTime: "asc" },
      },
      participants: {
        select: {
          id: true,
          name: true,
          userId: true,
          createdAt: true,
          votes: { select: { optionId: true, type: true } },
        },
        orderBy: [{ createdAt: "desc" }, { name: "desc" }],
      },
    },
  });

  if (!poll || poll.deleted) {
    return null;
  }

  return {
    pollId: poll.id,
    status: poll.status,
    timeZone: poll.timeZone,
    hideParticipants: poll.hideParticipants,
    hideScores: poll.hideScores,
    allowTentativeVotes: poll.allowTentativeVotes,
    requireParticipantEmail: poll.requireParticipantEmail,
    options: poll.options,
    responses: poll.participants.map(({ votes, ...response }) => ({
      ...response,
      votes: Object.fromEntries(
        votes.map((vote) => [vote.optionId, vote.type]),
      ),
    })),
  };
}
