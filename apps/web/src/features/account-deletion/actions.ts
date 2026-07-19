"use server";
import { subject } from "@casl/ability";
import { sendAccountDeletionScheduledEmail } from "@rallly/emails/templates/account-deletion-scheduled";
import { headers } from "next/headers";
import { after } from "next/server";
import { getInstanceBranding } from "@/emails/branding";
import { getScheduledDeletionDate } from "@/features/account-deletion/utils";
import { cancelUserSubscriptions } from "@/features/billing/mutations";
import { getLocale } from "@/i18n/server/get-locale";
import authLib from "@/lib/auth";
import { formatDateTime } from "@/lib/datetime/format";
import { AppError } from "@/lib/errors/app-error";
import { authActionClient } from "@/lib/safe-action/server";

// Cancelling the subscription happens first and is the one irreversible
// part: waiting until reap time would let a renewal charge the user during
// the recovery window. An account that cancels its deletion comes back on
// the free tier.
export const scheduleAccountDeletionAction = authActionClient
  .metadata({ actionName: "schedule_account_deletion" })
  .action(async ({ ctx }) => {
    if (ctx.ability.cannot("delete", subject("User", ctx.user))) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "You are not authorized to delete this account",
      });
    }

    await cancelUserSubscriptions({ userId: ctx.user.id });

    const deletedAt = new Date();

    await authLib.api.updateUser({
      body: { deletedAt },
      headers: await headers(),
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
  .action(async () => {
    await authLib.api.updateUser({
      body: { deletedAt: null },
      headers: await headers(),
    });
  });
