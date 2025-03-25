import { prisma } from "@rallly/database";
import { NextResponse } from "next/server";

import { checkApiAuthorization } from "@/utils/api-auth";

const BATCH_SIZE = 300;

/**
 * Remove polls and corresponding data that have been marked deleted for more than 30 days.
 */
export async function POST() {
  const unauthorized = checkApiAuthorization();
  if (unauthorized) return unauthorized;

  let totalDeletedPolls = 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const batch = await prisma.poll.findMany({
    where: {
      deleted: true,
      deletedAt: {
        lt: thirtyDaysAgo,
      },
    },
    select: { id: true },
    orderBy: { deletedAt: "asc" },
    take: BATCH_SIZE,
  });

  const deleted = await prisma.poll.deleteMany({
    where: {
      id: { in: batch.map((poll) => poll.id) },
    },
  });

  totalDeletedPolls += deleted.count;

  return NextResponse.json({
    success: true,
    summary: {
      deleted: {
        polls: totalDeletedPolls,
      },
    },
  });
}
