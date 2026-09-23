"use server";

import * as Sentry from "@sentry/nextjs";
import { after } from "next/server";
import { createMiddleware } from "next-safe-action";
import { nonprofitDocumentAssetProfile } from "@/features/billing/nonprofit/constants";
import {
  applyForNonprofitDiscount,
  deleteNonprofitDocuments,
  grantNonprofitDiscount,
} from "@/features/billing/nonprofit/mutations";
import {
  applyForNonprofitDiscountSchema,
  discardNonprofitDocumentsSchema,
  grantNonprofitDiscountSchema,
  signNonprofitDocumentUploadSchema,
} from "@/features/billing/nonprofit/schema";
import type { NonprofitApplicationStatus } from "@/features/billing/nonprofit/types";
import { getActiveSpaceForUser } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { AppError } from "@/lib/errors/app-error";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import {
  adminActionClient,
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
 * Deletes documents the form uploaded but will not submit: a later sign or
 * PUT in the same submit failed. Keys must belong to the actor's space.
 */
export const discardNonprofitDocumentsAction = authActionClient
  .metadata({ actionName: "discard_nonprofit_documents" })
  .use(createRateLimitMiddleware(10, "1 h"))
  .use(billingManageMiddleware)
  .inputSchema(discardNonprofitDocumentsSchema)
  .action(async ({ ctx, parsedInput }) => {
    for (const key of parsedInput.documentKeys) {
      assertAssetKey(key, {
        profile: nonprofitDocumentAssetProfile,
        entityId: ctx.space.id,
      });
    }
    await deleteNonprofitDocuments(parsedInput.documentKeys);
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
      // Keys are proven before anything else can fail, so a gate that stops
      // the application here still deletes what the applicant uploaded. The
      // mutation deletes on its own paths; nothing reaches it from here.
      const documentKeys: string[] = [];
      for (const key of parsedInput.documentKeys) {
        try {
          assertAssetKey(key, {
            profile: nonprofitDocumentAssetProfile,
            entityId: ctx.space.id,
          });
        } catch (error) {
          after(() => deleteNonprofitDocuments(documentKeys));
          throw error;
        }
        documentKeys.push(key);
      }

      // ctx.user is the database row, so this is not the session snapshot.
      if (!ctx.user.emailVerified) {
        after(() => deleteNonprofitDocuments(documentKeys));
        throw new AppError({
          code: "FORBIDDEN",
          message: "Verify your email address before applying",
        });
      }

      try {
        const result = await applyForNonprofitDiscount({
          spaceId: ctx.space.id,
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          organizationName: parsedInput.organizationName,
          website: parsedInput.website,
          documentKeys,
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

/**
 * Control panel grant for organizations the automated review cannot judge.
 * The space's owner is the beneficiary; the admin is recorded on the row.
 */
export const grantNonprofitDiscountAction = adminActionClient
  .metadata({ actionName: "grant_nonprofit_discount" })
  .inputSchema(grantNonprofitDiscountSchema)
  .action(async ({ ctx, parsedInput }) => {
    if (!isFeatureEnabled("nonprofitDiscount")) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Nonprofit discount is not available on this instance",
      });
    }

    return await grantNonprofitDiscount({
      spaceId: parsedInput.spaceId,
      organizationName: parsedInput.organizationName,
      grantedBy: ctx.user.id,
    });
  });
