import { prisma } from "@rallly/database";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle } from "hono/vercel";

const BATCH_SIZE = 100;

const app = new Hono().basePath("/api/house-keeping");

app.use("*", async (c, next) => {
  if (process.env.CRON_SECRET) {
    return bearerAuth({ token: process.env.CRON_SECRET })(c, next);
  }

  return c.json(
    {
      error: "CRON_SECRET is not set in environment variables",
    },
    500,
  );
});

/**
 * Marks inactive polls as deleted. Polls are inactive if they have not been
 * touched in the last 30 days and all dates are in the past.
 * Only marks polls as deleted if they belong to users without an active subscription
 * or if they don't have a user associated with them.
 */
app.get("/delete-inactive-polls", async (c) => {
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
      // We don't delete polls that belong to a space with an active subscription
      OR: [
        { spaceId: null },
        {
          space: {
            subscription: null,
          },
        },
        {
          space: {
            subscription: {
              active: false,
            },
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

  return c.json({
    success: true,
    summary: {
      markedDeleted,
    },
  });
});

/**
 * Remove polls and corresponding data that have been marked deleted for more than 7 days.
 */
app.get("/remove-deleted-polls", async (c) => {
  // First get the ids of all the polls that have been marked as deleted for at least 7 days
  let totalDeletedPolls = 0;
  let hasMore = true;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  while (hasMore) {
    const batch = await prisma.poll.findMany({
      where: {
        deleted: true,
        deletedAt: {
          lt: sevenDaysAgo,
        },
      },
      select: { id: true },
      take: BATCH_SIZE,
    });

    if (batch.length === 0) {
      hasMore = false;
      break;
    }

    const deleted = await prisma.poll.deleteMany({
      where: {
        id: { in: batch.map((poll) => poll.id) },
      },
    });

    totalDeletedPolls += deleted.count;
  }

  return c.json({
    success: true,
    summary: {
      deleted: {
        polls: totalDeletedPolls,
      },
    },
  });
});

export const GET = handle(app);
