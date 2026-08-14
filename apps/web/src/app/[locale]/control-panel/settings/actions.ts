"use server";

import { updateInstanceSettings } from "@/features/instance-settings/mutations";
import { instanceSettingsSchema } from "@/features/instance-settings/schema";
import { adminActionClient } from "@/lib/safe-action/server";

export const updateInstanceSettingsAction = adminActionClient
  .metadata({
    actionName: "update_instance_settings",
  })
  .inputSchema(instanceSettingsSchema)
  .action(async ({ parsedInput }) => {
    await updateInstanceSettings(parsedInput);
  });
