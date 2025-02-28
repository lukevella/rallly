import { prisma } from "@rallly/database";
import { NextResponse } from "next/server";

import { checkApiAuthorization } from "@/utils/api-auth";

/**
 * Remove polls and corresponding data that have been marked deleted for more than 7 days.
 */
export async function POST(req: Request) {
  const unauthorized = checkApiAuthorization();
  if (unauthorized) return unauthorized;

  const options = (await req.json()) as { take?: number } | undefined;

  // First get the ids of all the polls that have been marked as deleted for at least 7 days
  const deletedPolls = await prisma.poll.findMany({
    select: {
      id: true,
    },
    where: {
      deleted: true,
      deletedAt: {
        lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
    take: options?.take ?? 1000,
  });

  const deletedPollIds = deletedPolls.map((poll) => poll.id);

  const { count: deletedPollCount } = await prisma.poll.deleteMany({
    where: {
      id: {
        in: deletedPollIds,
      },
    },
  });

  return NextResponse.json({
    success: true,
    summary: {
      deleted: {
        polls: deletedPollCount,
      },
    },
  });
}
