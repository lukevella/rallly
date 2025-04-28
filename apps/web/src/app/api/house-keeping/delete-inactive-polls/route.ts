import { prisma } from "@rallly/database";
import { NextResponse } from "next/server";

import { checkApiAuthorization } from "@/utils/api-auth";

/**
 * Marks inactive polls as deleted. Polls are inactive if they have not been
 * touched in the last 30 days and all dates are in the past.
 * Only marks polls as deleted if they belong to users without an active subscription
 * or if they don't have a user associated with them.
 */
export async function POST() {
  const unauthorized = await checkApiAuthorization();
  if (unauthorized) return unauthorized;

  // Define the 30-day threshold once
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Mark inactive polls as deleted in a single query
  const { count: markedDeleted } = await prisma.poll.updateMany({
    where: {
      deleted: false,
      // All poll dates are in the past
      options: {
        none: {
          startTime: { gt: new Date() },
        },
      },
      // User is either null or doesn't have an active subscription
      OR: [
        { userId: null },
        {
          user: {
            OR: [{ subscription: null }, { subscription: { active: false } }],
          },
        },
      ],
      // Poll is inactive (not touched AND not viewed in the last 30 days)
      touchedAt: { lt: thirtyDaysAgo },
      views: {
        none: {
          viewedAt: { gte: thirtyDaysAgo },
        },
      },
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
