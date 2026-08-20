"use server";

import {
  updateInstanceFooterLinks,
  updateInstanceSettings,
} from "@/features/instance-settings/mutations";
import {
  footerLinksSchema,
  instanceSettingsSchema,
} from "@/features/instance-settings/schema";
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
    await updateInstanceFooterLinks(parsedInput.footerLinks);
  });
