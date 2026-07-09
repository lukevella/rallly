import { createLogger } from "@rallly/logger";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle } from "hono/vercel";
import {
  autoClosePolls,
  deleteInactivePolls,
  removeDeletedPolls,
} from "@/features/poll/mutations";

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

app.get("/delete-inactive-polls", async (c) => {
  const markedDeleted = await deleteInactivePolls();

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

app.get("/auto-close-polls", async (c) => {
  const closed = await autoClosePolls();

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

app.get("/remove-deleted-polls", async (c) => {
  const totalDeletedPolls = await removeDeletedPolls();

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
