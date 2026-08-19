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
      // Billing first: this is the only cleanup whose failure costs the user
      // money, and `after` gives no delivery guarantee — if the instance is
      // recycled mid-callback, the steps that run last are the ones lost.
      // Deleting the customer also cancels its subscriptions, so the explicit
      // cancel is a best effort for the case where there is no customer id.
      try {
        await cancelSubscriptionsById({ subscriptionIds });

        if (customerId) {
          await deleteStripeCustomer({ customerId });
        }
      } catch (error) {
        // Logged with the ids because nothing in the database refers to this
        // account any more: these lines are the only record to reconcile from.
        logger.error(
          { error, customerId, subscriptionIds },
          "Failed to clean up billing after account deletion — subscription may still be active",
        );
      }

      try {
        await deletePostHogPerson({ distinctId: userId });
      } catch (error) {
        logger.error(
          { error },
          "Failed to delete PostHog person after account deletion",
        );
      }

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

      await flushPostHog();
    });
  });
