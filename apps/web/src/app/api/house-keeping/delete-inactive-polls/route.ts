import { prisma } from "@rallly/database";
import { NextResponse } from "next/server";

import { checkApiAuthorization } from "@/utils/api-auth";

/**
 * Marks inactive polls as deleted. Polls are inactive if the last option is more than
 * 30 days in the past.
 * Only marks polls as deleted if they belong to users without an active subscription
 * or if they don't have a user associated with them.
 */
export async function POST() {
  const unauthorized = checkApiAuthorization();
  if (unauthorized) return unauthorized;

  // Mark inactive polls as deleted in a single query
  const { count: markedDeleted } = await prisma.poll.updateMany({
    where: {
      deleted: false,
      options: {
        none: {
          startTime: {
            lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      // Include polls without a user or with users that don't have an active subscription
      OR: [
        { userId: null },
        {
          user: {
            OR: [{ subscription: null }, { subscription: { active: false } }],
          },
        },
      ],
    },
    data: {
      deleted: true,
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
    summary: {
      markedDeleted,
    },
  });
}
