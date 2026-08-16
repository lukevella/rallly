"use server";

import {
  brandingLogoEntityIds,
  brandingLogoProfiles,
} from "@/features/instance-settings/constants";
import {
  updateInstanceLogo,
  updateInstanceSettings,
} from "@/features/instance-settings/mutations";
import {
  brandingLogoUploadSchema,
  brandingSettingsSchema,
  removeBrandingLogoSchema,
  updateBrandingLogoSchema,
} from "@/features/instance-settings/schema";
import { getWhiteLabelAddon } from "@/features/licensing/data";
import { AppError } from "@/lib/errors/app-error";
import { adminActionClient } from "@/lib/safe-action/server";
import {
  assertAssetKey,
  createAssetUploadUrl,
} from "@/lib/storage/asset-upload";

async function requireWhiteLabelAddon() {
  const hasWhiteLabelAddon = await getWhiteLabelAddon();

  if (!hasWhiteLabelAddon) {
    throw new AppError({
      code: "PAYMENT_REQUIRED",
      message: "Custom branding requires the white label add-on.",
    });
  }
}

export const updateBrandingSettingsAction = adminActionClient
  .metadata({
    actionName: "update_branding_settings",
  })
  .inputSchema(brandingSettingsSchema.partial())
  .action(async ({ parsedInput }) => {
    await requireWhiteLabelAddon();

    await updateInstanceSettings(parsedInput);
  });

export const getBrandingLogoUploadUrlAction = adminActionClient
  .metadata({
    actionName: "get_branding_logo_upload_url",
  })
  .inputSchema(brandingLogoUploadSchema)
  .action(async ({ parsedInput }) => {
    await requireWhiteLabelAddon();

    return await createAssetUploadUrl({
      profile: brandingLogoProfiles[parsedInput.logoType],
      entityId: brandingLogoEntityIds[parsedInput.logoType],
      fileType: parsedInput.fileType,
      fileSize: parsedInput.fileSize,
    });
  });

export const updateBrandingLogoAction = adminActionClient
  .metadata({
    actionName: "update_branding_logo",
  })
  .inputSchema(updateBrandingLogoSchema)
  .action(async ({ parsedInput }) => {
    await requireWhiteLabelAddon();

    assertAssetKey(parsedInput.imageKey, {
      profile: brandingLogoProfiles[parsedInput.logoType],
      entityId: brandingLogoEntityIds[parsedInput.logoType],
    });

    await updateInstanceLogo({
      logoType: parsedInput.logoType,
      imageKey: parsedInput.imageKey,
    });
  });

export const removeBrandingLogoAction = adminActionClient
  .metadata({
    actionName: "remove_branding_logo",
  })
  .inputSchema(removeBrandingLogoSchema)
  .action(async ({ parsedInput }) => {
    await requireWhiteLabelAddon();

    await updateInstanceLogo({
      logoType: parsedInput.logoType,
      imageKey: null,
    });
  });
