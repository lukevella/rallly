import { prisma } from "@rallly/database";
import { NextResponse } from "next/server";

import { checkApiAuthorization } from "@/utils/api-auth";

/**
 * Remove polls and corresponding data that have been marked deleted for more than 7 days.
 */
export async function POST() {
  const unauthorized = checkApiAuthorization();
  if (unauthorized) return unauthorized;

  // First get the ids of all the polls that have been marked as deleted for at least 7 days
  const deletedPolls = await prisma.poll.deleteMany({
    where: {
      deleted: true,
      deletedAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });

  return NextResponse.json({
    success: true,
    summary: {
      deleted: {
        polls: deletedPolls.count,
      },
    },
  });
}
