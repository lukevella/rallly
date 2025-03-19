import { prisma } from "@rallly/database";
import { unstable_cache } from "next/cache";

export async function getPollCountByStatus(userId: string) {
  const res = await prisma.poll.groupBy({
    by: ["status"],
    where: { userId },
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

export const getCachedPollCountByStatus = unstable_cache(
  getPollCountByStatus,
  ["poll-count-by-status"],
  {
    revalidate: 60 * 5,
  },
);
