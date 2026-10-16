"use server";

import {
  updateInstanceFooterLinks,
  updateInstanceSettings,
} from "@/features/instance-settings/mutations";
import {
  footerLinksSchema,
  instanceSettingsSchema,
} from "@/features/instance-settings/schema";
import { AppError } from "@/lib/errors/app-error";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { adminActionClient } from "@/lib/safe-action/server";

export const updateInstanceSettingsAction = adminActionClient
  .metadata({
    actionName: "update_instance_settings",
  })
  .inputSchema(instanceSettingsSchema)
  .action(async ({ parsedInput }) => {
    await updateInstanceSettings(parsedInput);
  });

export const updateFooterLinksAction = adminActionClient
  .metadata({
    actionName: "update_footer_links",
  })
  .inputSchema(footerLinksSchema)
  .action(async ({ parsedInput }) => {
    // Cloud renders its own static links, so `loadFooterLinks` discards
    // whatever is stored. Without this, a cloud admin would save, see a
    // success toast, and reload into an empty form.
    if (!isFeatureEnabled("customFooterLinks")) {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Footer links are not available on this instance",
      });
    }

    await updateInstanceFooterLinks(parsedInput.footerLinks);
  });
