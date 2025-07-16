"use server";

import { prisma } from "@rallly/database";
import { revalidateTag } from "next/cache";
import { instanceSettingsTag } from "@/features/instance-settings/constants";
import { instanceSettingsSchema } from "@/features/instance-settings/schema";
import { adminActionClient } from "@/features/safe-action/server";

export const updateInstanceSettingsAction = adminActionClient
  .metadata({
    actionName: "update_instance_settings",
  })
  .inputSchema(instanceSettingsSchema)
  .action(async ({ parsedInput }) => {
    await prisma.instanceSettings.update({
      where: {
        id: 1,
      },
      data: parsedInput,
    });

    revalidateTag(instanceSettingsTag);
  });
