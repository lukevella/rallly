"use server";
import { subject } from "@casl/ability";
import { sendAccountDeletedEmail } from "@rallly/emails/templates/account-deleted";
import { sendConfirmAccountDeletionEmail } from "@rallly/emails/templates/confirm-account-deletion";
import { createLogger } from "@rallly/logger";
import { after } from "next/server";
import * as z from "zod";
import { getInstanceBranding } from "@/emails/branding";
import { getActiveSubscriptionIds } from "@/features/billing/data";
import {
  cancelSubscriptionsById,
  deleteStripeCustomer,
} from "@/features/billing/mutations";
import { DELETE_ACCOUNT_OTP_TYPE } from "@/features/user/account-deletion/constants";
import { consumeAccountDeletionOTP } from "@/features/user/account-deletion/mutations";
import { hardDeleteUser } from "@/features/user/mutations";
import { getLocale } from "@/i18n/server/get-locale";
import authLib, { signOut } from "@/lib/auth";
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

// Deletion is irreversible and the session alone is not proof of intent: a
// hijacked session or an unattended laptop already has it. Requiring a code
// sent to the account email also leaves the owner a record of the attempt.
export const requestAccountDeletionCodeAction = authActionClient
  .metadata({ actionName: "request_account_deletion_code" })
  .use(createRateLimitMiddleware(5, "1 h"))
  .action(async ({ ctx }) => {
    if (ctx.ability.cannot("delete", subject("User", ctx.user))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You are not authorized to delete this account",
      });
    }

    const { email } = ctx.user;
    const locale = ctx.user.locale ?? (await getLocale());
    const branding = await getInstanceBranding();

    const code = await authLib.api.createVerificationOTP({
      body: { email, type: DELETE_ACCOUNT_OTP_TYPE },
    });

    after(() =>
      sendConfirmAccountDeletionEmail({
        to: email,
        locale,
        branding,
        props: { code },
      }),
    );
  });

// Deletion is immediate and irreversible. The user row goes first so the
// account and its email address are genuinely released straight away; the
// external cleanup that used to be retried by the reaper now runs after the
// response. A failure there leaves an orphaned Stripe customer or PostHog
// person rather than blocking the user, so it is logged loudly.
export const deleteAccountAction = authActionClient
  .metadata({ actionName: "delete_account" })
  .use(createRateLimitMiddleware(5, "1 h"))
  .inputSchema(z.object({ otp: z.string().regex(/^\d{6}$/) }))
  .action(async ({ ctx, parsedInput }) => {
    if (ctx.ability.cannot("delete", subject("User", ctx.user))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You are not authorized to delete this account",
      });
    }

    // The email is taken from the session, never from the client: the
    // underlying Better-Auth OTP endpoints are unauthenticated, so trusting a
    // submitted address would let anyone verify a code against any account.
    const otpEmail = ctx.user.email;

    try {
      await authLib.api.checkVerificationOTP({
        body: {
          email: otpEmail,
          type: DELETE_ACCOUNT_OTP_TYPE,
          otp: parsedInput.otp,
        },
      });
    } catch {
      // Every failure mode (wrong code, expired, attempts exhausted) throws;
      // reported as a value so the dialog can show it on the field.
      return { ok: false as const, reason: "invalid_code" as const };
    }

    // Consumed immediately: the code must not be replayable, nor reusable as
    // an email verification.
    await consumeAccountDeletionOTP({ email: otpEmail });

    // Everything the cleanup and the confirmation email need has to be read
    // before the row disappears — the subscription rows cascade away with it.
    const { id: userId, email, customerId } = ctx.user;
    const locale = ctx.user.locale ?? (await getLocale());
    const branding = await getInstanceBranding();
    const subscriptionIds = await getActiveSubscriptionIds(userId);

    // Signed out before the row goes: signOut resolves the session from the
    // request, so it has to run while that session still resolves. The
    // nextCookies plugin applies the clearing headers to this response, which
    // a client-side signOut cannot do once the user no longer exists.
    await signOut();

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
