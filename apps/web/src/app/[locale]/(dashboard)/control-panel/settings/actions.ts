"use server";

import { requireAdmin } from "@/auth/queries";
import type { InstanceSettings } from "@/features/instance-settings/schema";
import { prisma } from "@rallly/database";

export async function updateInstanceSettings({
  disableUserRegistration,
}: InstanceSettings) {
  await requireAdmin();

  await prisma.instanceSettings.update({
    where: {
      id: 1,
    },
    data: {
      disableUserRegistration,
    },
  });
}
