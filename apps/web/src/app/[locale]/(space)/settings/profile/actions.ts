"use server";
import { subject } from "@casl/ability";
import { sendAccountDeletionScheduledEmail } from "@rallly/emails/templates/account-deletion-scheduled";
import { after } from "next/server";
import { getInstanceBranding } from "@/emails/branding";
import {
  resumeUserSubscriptionRenewals,
  stopUserSubscriptionRenewals,
} from "@/features/billing/mutations";
import {
  cancelAccountDeletion,
  scheduleAccountDeletion,
} from "@/features/user/account-deletion/mutations";
import { getScheduledDeletionDate } from "@/features/user/account-deletion/utils";
import { getLocale } from "@/i18n/server/get-locale";
import { formatDateTime } from "@/lib/datetime/format";
import { AppError } from "@/lib/errors/app-error";
import { track } from "@/lib/posthog";
import {
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";

// Renewals are stopped (cancel_at_period_end) rather than the subscription
// cancelled, so nothing here is irreversible: no charge can land during the
// recovery window, the user keeps the Pro time they paid for, and cancelling
// the deletion restores the subscription. deletedAt is written first; if the
// Stripe call fails, it is rolled back so the two never drift apart. The
// reaper hard-cancels at the end of the window.
export const scheduleAccountDeletionAction = authActionClient
  .metadata({ actionName: "schedule_account_deletion" })
  // Each call hits Stripe and sends an email — keep the ceiling low.
  .use(createRateLimitMiddleware(3, "1 h"))
  .action(async ({ ctx }) => {
    if (ctx.ability.cannot("delete", subject("User", ctx.user))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You are not authorized to delete this account",
      });
    }

    const deletedAt = await scheduleAccountDeletion({ userId: ctx.user.id });

    let stoppedRenewals: number;
    try {
      stoppedRenewals = await stopUserSubscriptionRenewals({
        userId: ctx.user.id,
      });
    } catch (error) {
      await cancelAccountDeletion({ userId: ctx.user.id });
      throw error;
    }

    track(ctx.user, {
      event: "account_deletion_schedule",
      properties: {
        hadActiveSubscription: stoppedRenewals > 0,
      },
    });

    const locale = ctx.user.locale ?? (await getLocale());
    const branding = await getInstanceBranding();
    const deletionDate = formatDateTime(getScheduledDeletionDate(deletedAt), {
      preset: "dateLong",
      locale,
      timeZone: ctx.user.timeZone,
    });

    after(() =>
      sendAccountDeletionScheduledEmail({
        to: ctx.user.email,
        locale,
        branding,
        props: { deletionDate },
      }),
    );
  });

export const cancelAccountDeletionAction = authActionClient
  .metadata({ actionName: "cancel_account_deletion" })
  .use(createRateLimitMiddleware(10, "1 h"))
  .action(async ({ ctx }) => {
    await cancelAccountDeletion({ userId: ctx.user.id });
    await resumeUserSubscriptionRenewals({ userId: ctx.user.id });

    track(ctx.user, { event: "account_deletion_cancel" });
  });
