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

/** What the review request email needs to know about its recipient. */
export async function getReviewRequestRecipient(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      locale: true,
      banned: true,
      deletedAt: true,
    },
  });
}
