"use server";

import { isBillingEnabled } from "@/features/billing/constants";
import type { TrialRefusalReason } from "@/features/billing/trial/mutations";
import { startSpaceTrial } from "@/features/billing/trial/mutations";
import { getActiveSpaceForUser } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { AppError } from "@/lib/errors/app-error";
import { identifyGroup, track } from "@/lib/posthog";
import { authActionClient } from "@/lib/safe-action/server";

const refusalMessages: Record<TrialRefusalReason, string> = {
  space_not_found: "Space not found",
  trial_already_used: "This space has already used its free trial",
  subscription_active: "This space already has an active subscription",
  already_pro: "This space is already on Pro",
};

/**
 * Starts the free trial for the caller's active space. The front end shows
 * the button only to an eligible space; this refuses everything else, so a
 * second press or a stale page never starts a second trial.
 */
export const startTrial = authActionClient
  .metadata({ actionName: "start_trial" })
  .action(async ({ ctx }): Promise<{ endsAt: Date }> => {
    // Self-hosted instances are licensed, not billed: every space is pro.
    if (!isBillingEnabled) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Trials are not available on this instance",
      });
    }

    const space = await getActiveSpaceForUser(ctx.user.id);

    if (!space) {
      throw new AppError({ code: "NOT_FOUND", message: "Space not found" });
    }

    const ability = defineAbilityForMember({ user: ctx.user, space });

    if (ability.cannot("manage", "Billing")) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Only the space owner can start the trial",
      });
    }

    const result = await startSpaceTrial({ spaceId: space.id });

    if (!result.started) {
      throw new AppError({
        code: result.reason === "space_not_found" ? "NOT_FOUND" : "FORBIDDEN",
        message: refusalMessages[result.reason],
      });
    }

    identifyGroup({
      groupType: "space",
      groupKey: space.id,
      properties: { tier: "pro" },
    });

    track(ctx.user, {
      event: "billing:trial_start",
      properties: { ends_at: result.endsAt.toISOString() },
      groups: { space: space.id },
    });

    return { endsAt: result.endsAt };
  });
