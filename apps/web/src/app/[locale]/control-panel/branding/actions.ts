"use server";

import * as z from "zod";
import { allowedMimeTypes } from "@/components/image-upload/types";
import {
  brandingImageTypeSchema,
  brandingSettingsSchema,
} from "@/features/branding/schema";
import { updateInstanceSettings } from "@/features/instance-settings/mutations";
import { getWhiteLabelAddon } from "@/features/licensing/data";
import { AppError } from "@/lib/errors/app-error";
import { adminActionClient } from "@/lib/safe-action/server";
import { getImageUploadUrl } from "@/lib/storage/image-upload";

const whiteLabelActionClient = adminActionClient.use(async ({ next }) => {
  const hasWhiteLabelAddon = await getWhiteLabelAddon();
  if (!hasWhiteLabelAddon) {
    throw new AppError({
      code: "PAYMENT_REQUIRED",
      message: "Custom branding requires the white label add-on",
    });
  }
  return next();
});

function assertUploadedLogoKey(key: string | null | undefined) {
  // Only accept keys the upload action minted (prefixed with `branding/`) so an
  // admin request cannot persist an arbitrary bucket object as a logo.
  if (key && !key.startsWith("branding/")) {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Invalid image key",
    });
  }
}

export const updateBrandingSettingsAction = whiteLabelActionClient
  .metadata({ actionName: "update_branding_settings" })
  .inputSchema(brandingSettingsSchema)
  .action(async ({ parsedInput }) => {
    assertUploadedLogoKey(parsedInput.logoUrl);
    assertUploadedLogoKey(parsedInput.logoUrlDark);
    assertUploadedLogoKey(parsedInput.logoIconUrl);
    await updateInstanceSettings(parsedInput);
  });

export const getBrandingImageUploadUrlAction = whiteLabelActionClient
  .metadata({ actionName: "get_branding_image_upload_url" })
  .inputSchema(
    z.object({
      type: brandingImageTypeSchema,
      fileType: allowedMimeTypes,
      fileSize: z.number(),
    }),
  )
  .action(async ({ parsedInput }) => {
    return getImageUploadUrl({
      keyPrefix: "branding",
      entityId: parsedInput.type,
      fileType: parsedInput.fileType,
      fileSize: parsedInput.fileSize,
    });
  });
