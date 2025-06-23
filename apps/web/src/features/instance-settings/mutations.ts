"use server";

import { requireAdmin } from "@/auth/queries";
import { type InstanceSettings, prisma } from "@rallly/database";
import { revalidateTag } from "next/cache";
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
