import { prisma } from "@rallly/database";

export async function getPollCountByStatus(userId: string) {
  const res = await prisma.poll.groupBy({
    by: ["status"],
    where: { userId, deleted: false },
    _count: true,
  });

  const counts = res.reduce(
    (acc, item) => {
      acc[item.status] = item._count;
      return acc;
    },
    { live: 0, paused: 0, finalized: 0 },
  );

  return counts;
}
