import "server-only";

import { prisma } from "@rallly/database";
import { unstable_cache } from "next/cache";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { instanceSettingsTag } from "./constants";
import type { FooterLink } from "./schema";
import { footerLinkSchema } from "./schema";

// Stored links are re-validated on read, not just on write: a row edited
// directly in the database must not be able to put an unsafe href into an
// anchor. Invalid entries are dropped rather than failing the whole read, so
// one bad link cannot take down the login page.
function parseFooterLinks(value: unknown): FooterLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    const parsed = footerLinkSchema.safeParse(entry);
    return parsed.success ? [parsed.data] : [];
  });
}

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
        hideAttribution: true,
        footerLinks: true,
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
      hideAttribution: instanceSettings?.hideAttribution ?? null,
      footerLinks: parseFooterLinks(instanceSettings?.footerLinks),
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
