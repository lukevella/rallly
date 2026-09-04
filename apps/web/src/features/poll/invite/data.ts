import "server-only";

import { prisma } from "@rallly/database";

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
