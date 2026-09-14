"use server";

import * as Sentry from "@sentry/nextjs";
import { createMiddleware } from "next-safe-action";
import { nonprofitDocumentAssetProfile } from "@/features/billing/nonprofit/constants";
import { applyForNonprofitDiscount } from "@/features/billing/nonprofit/mutations";
import {
  applyForNonprofitDiscountSchema,
  signNonprofitDocumentUploadSchema,
} from "@/features/billing/nonprofit/schema";
import type { NonprofitApplicationStatus } from "@/features/billing/nonprofit/types";
import { getActiveSpaceForUser } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { AppError } from "@/lib/errors/app-error";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import {
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";
import {
  assertAssetKey,
  createAssetUploadUrl,
} from "@/lib/storage/asset-upload";

// Same gate as the billing settings page: the actor's active space, and
// only its owner may act. Injects the space into ctx.
const billingManageMiddleware = createMiddleware<{
  ctx: { user: { id: string } };
}>().define(async ({ ctx, next }) => {
  if (!isFeatureEnabled("nonprofitDiscount")) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Nonprofit discount is not available on this instance",
    });
  }

  const space = await getActiveSpaceForUser(ctx.user.id);

  if (!space) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "No active space found",
    });
  }

  const ability = defineAbilityForMember({ user: ctx.user, space });

  if (ability.cannot("manage", "Billing")) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Only the space owner can manage billing",
    });
  }

  return next({ ctx: { space } });
});

export const signNonprofitDocumentUploadAction = authActionClient
  .metadata({ actionName: "sign_nonprofit_document_upload" })
  .use(createRateLimitMiddleware(10, "1 h"))
  .use(billingManageMiddleware)
  .inputSchema(signNonprofitDocumentUploadSchema)
  .action(async ({ ctx, parsedInput }) => {
    return await createAssetUploadUrl({
      profile: nonprofitDocumentAssetProfile,
      entityId: ctx.space.id,
      fileType: parsedInput.fileType,
      fileSize: parsedInput.fileSize,
    });
  });

/**
 * Resolves to the outcome as a value so the dialog can render it; only the
 * gates (auth, flag, ownership, rate limit, key ownership) throw.
 */
export const applyForNonprofitDiscountAction = authActionClient
  .metadata({ actionName: "apply_for_nonprofit_discount" })
  .use(createRateLimitMiddleware(3, "1 d"))
  .use(billingManageMiddleware)
  .inputSchema(applyForNonprofitDiscountSchema)
  .action(
    async ({
      ctx,
      parsedInput,
    }): Promise<{
      outcome: NonprofitApplicationStatus;
      reason: string | null;
    }> => {
      // ctx.user is the database row, so this is not the session snapshot.
      if (!ctx.user.emailVerified) {
        throw new AppError({
          code: "FORBIDDEN",
          message: "Verify your email address before applying",
        });
      }

      for (const key of parsedInput.documentKeys) {
        assertAssetKey(key, {
          profile: nonprofitDocumentAssetProfile,
          entityId: ctx.space.id,
        });
      }

      try {
        const result = await applyForNonprofitDiscount({
          spaceId: ctx.space.id,
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          organizationName: parsedInput.organizationName,
          website: parsedInput.website,
          documentKeys: parsedInput.documentKeys,
        });

        if (result.outcome === "already_granted") {
          return { outcome: "approved", reason: null };
        }

        return result;
      } catch (error) {
        Sentry.captureException(error, {
          tags: { errorHandler: "safe-action" },
          extra: { actionName: "apply_for_nonprofit_discount" },
        });
        return { outcome: "failed", reason: null };
      }
    },
  );
