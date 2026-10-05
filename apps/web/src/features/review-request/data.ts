import "server-only";

import { prisma } from "@rallly/database";

/**
 * Polls whose current scheduled event this user finalized. A poll that was
 * reopened has no scheduled event, so it no longer counts.
 */
export async function countFinalizedPolls(userId: string) {
  return prisma.poll.count({
    where: { scheduledEvent: { userId } },
  });
}
