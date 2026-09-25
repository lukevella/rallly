import "server-only";

import { prisma } from "@rallly/database";

export async function findUsersScheduledForRemoval({
  cutoff,
  excludeUserIds,
  limit,
}: {
  cutoff: Date;
  excludeUserIds: string[];
  limit: number;
}) {
  return prisma.user.findMany({
    where: {
      deletedAt: { lt: cutoff },
      id: { notIn: excludeUserIds },
    },
    select: { id: true, email: true, customerId: true },
    take: limit,
  });
}

// Counts are limited to columns with a userId index. Vote and comment
// counts would scan participants/comments on an unindexed user_id, so the
// dialog mentions those without numbers.
export async function getAccountDeletionSummary({
  userId,
}: {
  userId: string;
}) {
  const [activePollCount, activeSubscriptionCount] = await Promise.all([
    prisma.poll.count({ where: { userId, deleted: false, status: "open" } }),
    prisma.subscription.count({ where: { userId, active: true } }),
  ]);

  return {
    activePollCount,
    hasActiveSubscription: activeSubscriptionCount > 0,
  };
}
