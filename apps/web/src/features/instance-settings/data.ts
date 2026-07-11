import "server-only";

import { prisma } from "@rallly/database";
import { unstable_cache } from "next/cache";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { instanceSettingsTag } from "./constants";

export const getInstanceSettings = unstable_cache(
  async () => {
    const instanceSettings = await prisma.instanceSettings.findUnique({
      where: {
        id: 1,
      },
      select: {
        disableUserRegistration: true,
      },
    });

    return {
      disableUserRegistration:
        instanceSettings?.disableUserRegistration ?? false,
    };
  },
  [],
  {
    tags: [instanceSettingsTag],
  },
);

export async function getRegistrationEnabled() {
  if (!isFeatureEnabled("registration")) {
    return false;
  }
  const instanceSettings = await getInstanceSettings();

  return !instanceSettings.disableUserRegistration;
}
