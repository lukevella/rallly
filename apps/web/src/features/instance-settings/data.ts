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
        instanceId: true,
        disableUserRegistration: true,
        appName: true,
        primaryColor: true,
        primaryColorDark: true,
        logo: true,
        logoDark: true,
        logoIcon: true,
        logoSize: true,
        hideAttribution: true,
      },
    });

    return {
      instanceId: instanceSettings?.instanceId ?? null,
      disableUserRegistration:
        instanceSettings?.disableUserRegistration ?? false,
      appName: instanceSettings?.appName ?? null,
      primaryColor: instanceSettings?.primaryColor ?? null,
      primaryColorDark: instanceSettings?.primaryColorDark ?? null,
      logo: instanceSettings?.logo ?? null,
      logoDark: instanceSettings?.logoDark ?? null,
      logoIcon: instanceSettings?.logoIcon ?? null,
      logoSize: instanceSettings?.logoSize ?? null,
      hideAttribution: instanceSettings?.hideAttribution ?? null,
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
