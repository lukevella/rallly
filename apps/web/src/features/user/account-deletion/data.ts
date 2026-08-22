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
