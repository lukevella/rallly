"use server";

import type { InstanceSettings } from "@rallly/database";
import { prisma } from "@rallly/database";
import { revalidateTag } from "next/cache";
import { requireAdmin } from "@/auth/queries";
import { instanceSettingsTag } from "./constants";

export async function updateInstanceSettings(data: Partial<InstanceSettings>) {
  await requireAdmin();

  await prisma.instanceSettings.update({
    where: {
      id: 1,
    },
    data,
  });

  revalidateTag(instanceSettingsTag);
}
