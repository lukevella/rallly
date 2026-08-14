"use server";

import { updateInstanceSettings } from "@/features/instance-settings/mutations";
import { brandingSettingsSchema } from "@/features/instance-settings/schema";
import { getWhiteLabelAddon } from "@/features/licensing/data";
import { AppError } from "@/lib/errors/app-error";
import { adminActionClient } from "@/lib/safe-action/server";

export const updateBrandingSettingsAction = adminActionClient
  .metadata({
    actionName: "update_branding_settings",
  })
  .inputSchema(brandingSettingsSchema.partial())
  .action(async ({ parsedInput }) => {
    const hasWhiteLabelAddon = await getWhiteLabelAddon();

    if (!hasWhiteLabelAddon) {
      throw new AppError({
        code: "PAYMENT_REQUIRED",
        message: "Custom branding requires the white label add-on.",
      });
    }

    await updateInstanceSettings(parsedInput);
  });
