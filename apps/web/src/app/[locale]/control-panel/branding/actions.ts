"use server";

import {
  updateInstanceLogo,
  updateInstanceSettings,
} from "@/features/instance-settings/mutations";
import type { BrandingLogoType } from "@/features/instance-settings/schema";
import {
  brandingLogoUploadSchema,
  brandingSettingsSchema,
  removeBrandingLogoSchema,
  updateBrandingLogoSchema,
} from "@/features/instance-settings/schema";
import { getWhiteLabelAddon } from "@/features/licensing/data";
import { AppError } from "@/lib/errors/app-error";
import { adminActionClient } from "@/lib/safe-action/server";
import { getImageUploadUrl } from "@/lib/storage/image-upload";

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

const logoEntityIds: Record<BrandingLogoType, string> = {
  logo: "logo",
  logoDark: "logo-dark",
  logoIcon: "logo-icon",
};

export const getBrandingLogoUploadUrlAction = adminActionClient
  .metadata({
    actionName: "get_branding_logo_upload_url",
  })
  .inputSchema(brandingLogoUploadSchema)
  .action(async ({ parsedInput }) => {
    await requireWhiteLabelAddon();

    return await getImageUploadUrl({
      keyPrefix: "branding",
      entityId: logoEntityIds[parsedInput.logoType],
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

    if (!parsedInput.imageKey.startsWith("branding/")) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Invalid image key",
      });
    }

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
