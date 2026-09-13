"use server";

import { createMiddleware } from "next-safe-action";
import { nonprofitDocumentAssetProfile } from "@/features/billing/nonprofit/constants";
import { signNonprofitDocumentUploadSchema } from "@/features/billing/nonprofit/schema";
import { getActiveSpaceForUser } from "@/features/space/data";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { AppError } from "@/lib/errors/app-error";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import {
  authActionClient,
  createRateLimitMiddleware,
} from "@/lib/safe-action/server";
import { createAssetUploadUrl } from "@/lib/storage/asset-upload";

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
