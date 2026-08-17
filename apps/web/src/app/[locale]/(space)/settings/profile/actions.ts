"use server";
import { subject } from "@casl/ability";
import { sendAccountDeletedEmail } from "@rallly/emails/templates/account-deleted";
import { createLogger } from "@rallly/logger";
import { after } from "next/server";
import { getInstanceBranding } from "@/emails/branding";
import { getActiveSubscriptionIds } from "@/features/billing/data";
import {
  cancelSubscriptionsById,
  deleteStripeCustomer,
} from "@/features/billing/mutations";
import { hardDeleteUser } from "@/features/user/mutations";
import { getLocale } from "@/i18n/server/get-locale";
import { AppError } from "@/lib/errors/app-error";
import {
  deletePostHogPerson,
  flushPostHog,
  trackSystemEvent,
} from "@/lib/posthog";
import {
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";

const logger = createLogger("account-deletion");

// Deletion is immediate and irreversible. The user row goes first so the
// account and its email address are genuinely released straight away; the
// external cleanup that used to be retried by the reaper now runs after the
// response. A failure there leaves an orphaned Stripe customer or PostHog
// person rather than blocking the user, so it is logged loudly.
export const deleteAccountAction = authActionClient
  .metadata({ actionName: "delete_account" })
  .use(createRateLimitMiddleware(3, "1 h"))
  .action(async ({ ctx }) => {
    if (ctx.ability.cannot("delete", subject("User", ctx.user))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You are not authorized to delete this account",
      });
    }

    // Everything the cleanup and the confirmation email need has to be read
    // before the row disappears — the subscription rows cascade away with it.
    const { id: userId, email, customerId } = ctx.user;
    const locale = ctx.user.locale ?? (await getLocale());
    const branding = await getInstanceBranding();
    const subscriptionIds = await getActiveSubscriptionIds(userId);

    await hardDeleteUser({ userId });

    // Personless by design — the person this event is about was just erased.
    trackSystemEvent({ event: "account_deletion_complete" });

    after(async () => {
      try {
        await sendAccountDeletedEmail({
          to: email,
          locale,
          branding,
          props: {},
        });
      } catch (error) {
        logger.error({ error }, "Failed to send account deletion email");
      }

      // Subscriptions are cancelled outright: there is no recovery window
      // left for the remaining paid time to matter, and the dialog warns
      // first. Stripe runs after the delete so an outage there can never
      // stop someone from deleting their account.
      try {
        await cancelSubscriptionsById({ subscriptionIds });
      } catch (error) {
        logger.error(
          { error, subscriptionIds },
          "Failed to cancel subscriptions after account deletion",
        );
      }

      if (customerId) {
        try {
          await deleteStripeCustomer({ customerId });
        } catch (error) {
          logger.error(
            { error, customerId },
            "Failed to delete Stripe customer after account deletion",
          );
        }
      }

      try {
        await deletePostHogPerson({ distinctId: userId });
      } catch (error) {
        logger.error(
          { error },
          "Failed to delete PostHog person after account deletion",
        );
      }

      await flushPostHog();
    });
  });
