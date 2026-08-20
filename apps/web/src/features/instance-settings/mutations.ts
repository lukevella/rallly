import "server-only";

import { prisma } from "@rallly/database";
import { updateTag } from "next/cache";
import { replaceStoredAsset } from "@/lib/storage/asset-upload";
import { instanceSettingsTag } from "./constants";
import type { BrandingLogoType, FooterLink } from "./schema";

export async function updateInstanceSettings(data: {
  disableUserRegistration?: boolean;
  appName?: string;
  primaryColor?: string;
  primaryColorDark?: string;
  hideAttribution?: boolean;
}) {
  // The id 1 row is seeded by migration, so it always exists
  await prisma.instanceSettings.update({
    where: {
      id: 1,
    },
    data,
  });

  updateTag(instanceSettingsTag);
}

export async function updateInstanceLogo({
  logoType,
  imageKey,
}: {
  logoType: BrandingLogoType;
  imageKey: string | null;
}) {
  const instanceSettings = await prisma.instanceSettings.findUnique({
    where: {
      id: 1,
    },
    select: {
      logo: true,
      logoDark: true,
      logoIcon: true,
    },
  });

  await replaceStoredAsset({
    currentKey: instanceSettings?.[logoType],
    nextKey: imageKey,
    persist: async () => {
      await prisma.instanceSettings.update({
        where: {
          id: 1,
        },
        data: {
          [logoType]: imageKey,
        },
      });

      updateTag(instanceSettingsTag);
    },
  });
}

export async function updateInstanceFooterLinks(footerLinks: FooterLink[]) {
  await prisma.instanceSettings.update({
    where: {
      id: 1,
    },
    data: {
      footerLinks,
    },
  });

  updateTag(instanceSettingsTag);
}
