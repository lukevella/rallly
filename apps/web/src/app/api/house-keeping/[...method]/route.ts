import { createLogger } from "@rallly/logger";
import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { handle } from "hono/vercel";
import {
  cancelUserSubscriptions,
  deleteStripeCustomer,
} from "@/features/billing/mutations";
import {
  autoClosePolls,
  deleteInactivePolls,
  removeDeletedPolls,
} from "@/features/poll/mutations";
import { findUsersScheduledForRemoval } from "@/features/user/account-deletion/data";
import { getAccountDeletionCutoff } from "@/features/user/account-deletion/utils";
import { hardDeleteUser } from "@/features/user/mutations";
import {
  deletePostHogPerson,
  flushPostHog,
  trackSystemEvent,
} from "@/lib/posthog";

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

// Each user's removal makes external API calls, so give the function room
// beyond the serverless default.
export const maxDuration = 300;

const REMOVE_DELETED_USERS_BATCH_SIZE = 50;
// Backlog beyond this spills to the next daily run instead of risking a
// function timeout mid-user.
const REMOVE_DELETED_USERS_MAX_PER_RUN = 500;

// Reaper for accounts whose scheduled deletion passed the recovery window.
// Composed here because it spans features: external stores go first — Stripe
// (defensive subscription cancel, then the customer object; invoices are
// lawfully retained by Stripe) and PostHog — so a failure there leaves the
// user row in place for the next run to retry.
async function removeDeletedUsers() {
  const cutoff = getAccountDeletionCutoff();
  const failedUserIds: string[] = [];
  let deletedUsers = 0;

  while (
    deletedUsers + failedUserIds.length <
    REMOVE_DELETED_USERS_MAX_PER_RUN
  ) {
    const users = await findUsersScheduledForRemoval({
      cutoff,
      excludeUserIds: failedUserIds,
      limit: REMOVE_DELETED_USERS_BATCH_SIZE,
    });

    if (users.length === 0) {
      break;
    }

    for (const user of users) {
      try {
        await cancelUserSubscriptions({ userId: user.id });

        if (user.customerId) {
          await deleteStripeCustomer({ customerId: user.customerId });
        }

        await deletePostHogPerson({ distinctId: user.id });

        await hardDeleteUser({ userId: user.id, email: user.email });

        // Personless by design — the person this event is about was just
        // erased, so it must not create or attach to a profile.
        trackSystemEvent({ event: "account_deletion_complete" });

        deletedUsers++;
      } catch (error) {
        logger.error(
          { userId: user.id, error },
          "Failed to remove user scheduled for deletion",
        );
        failedUserIds.push(user.id);
      }
    }
  }

  if (deletedUsers + failedUserIds.length >= REMOVE_DELETED_USERS_MAX_PER_RUN) {
    logger.warn(
      { deletedUsers, failed: failedUserIds.length },
      "Reached the per-run cap for removing deleted users; remaining backlog spills to the next run",
    );
  }

  return deletedUsers;
}

app.get("/remove-deleted-users", async (c) => {
  const deletedUsers = await removeDeletedUsers();

  await flushPostHog();

  logger.info(
    { task: "remove-deleted-users", deletedUsers },
    "Removed users whose scheduled deletion passed the recovery window",
  );

  return c.json({
    success: true,
    summary: {
      deleted: {
        users: deletedUsers,
      },
    },
  });
});

export const GET = handle(app);
