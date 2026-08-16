import "server-only";

import { prisma } from "@rallly/database";
import { updateTag } from "next/cache";
import { after } from "next/server";
import { deleteImageFromS3 } from "@/lib/storage/image-upload";
import { isStorageKey } from "@/lib/storage/resolve-storage-url";
import { instanceSettingsTag } from "./constants";
import type { BrandingLogoType } from "./schema";

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

  const oldValue = instanceSettings?.[logoType];

  await prisma.instanceSettings.update({
    where: {
      id: 1,
    },
    data: {
      [logoType]: imageKey,
    },
  });

  updateTag(instanceSettingsTag);

  // Only delete objects we own; a URL value points at externally hosted media
  if (oldValue && isStorageKey(oldValue)) {
    after(() => deleteImageFromS3(oldValue));
  }
}
