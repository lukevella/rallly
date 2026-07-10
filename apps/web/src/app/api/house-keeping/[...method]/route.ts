import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle } from "hono/vercel";

const BATCH_SIZE = 100;

const logger = createLogger("api/house-keeping");

const app = new Hono().basePath("/api/house-keeping");

app.use("*", async (c, next) => {
  if (process.env.CRON_SECRET) {
    return bearerAuth({ token: process.env.CRON_SECRET })(c, next);
  }

  logger.error("CRON_SECRET is not set in environment variables");

  return c.json(
    {
      error: "CRON_SECRET is not set in environment variables",
    },
    500,
  );
});

/**
 * Marks inactive polls as deleted. Polls are inactive if they have not been
 * updated in the last 30 days and all dates are in the past.
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
            tier: {
              not: "pro",
            },
          },
        },
      ],
      // Poll is inactive: not edited, and no participant activity (new or
      // updated responses) or new comments in the last 30 days
      updatedAt: { lt: thirtyDaysAgo },
      participants: {
        none: { updatedAt: { gte: thirtyDaysAgo } },
      },
      comments: {
        none: { createdAt: { gte: thirtyDaysAgo } },
      },
    },
    data: {
      deleted: true,
      deletedAt: new Date(),
    },
  });

  logger.info(
    { task: "delete-inactive-polls", markedDeleted },
    "Marked inactive polls as deleted",
  );

  return c.json({
    success: true,
    summary: {
      markedDeleted,
    },
  });
});

/**
 * Closes polls whose options have all ended — i.e. no option ends in the
 * future, where an option ends at start_time + duration (all-day options, with
 * duration 0, are treated as ending 24h after their start). Closing is
 * non-destructive: the poll becomes read-only but is preserved.
 *
 * Raw SQL because the option-end comparison (start_time + duration) can't be
 * expressed in a Prisma `where`. It also deliberately does not touch
 * `updated_at`, so closing a poll doesn't reset the inactivity clock that
 * delete-inactive-polls keys off.
 */
app.get("/auto-close-polls", async (c) => {
  const closed = await prisma.$executeRaw`
    UPDATE polls p
    SET status = 'closed', closed_reason = 'auto'
    WHERE p.status = 'open'
      AND p.deleted = false
      AND EXISTS (SELECT 1 FROM options o WHERE o.poll_id = p.id)
      AND NOT EXISTS (
        SELECT 1 FROM options o
        WHERE o.poll_id = p.id
          AND o.start_time + (CASE WHEN o.duration_minutes = 0
                THEN interval '24 hours'
                ELSE make_interval(mins => o.duration_minutes) END) > (now() AT TIME ZONE 'UTC')
      )
  `;

  logger.info(
    { task: "auto-close-polls", closed },
    "Closed polls with all options ended",
  );

  return c.json({
    success: true,
    summary: {
      closed,
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

  logger.info(
    { task: "remove-deleted-polls", deletedPolls: totalDeletedPolls },
    "Removed polls marked deleted over 7 days ago",
  );

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
