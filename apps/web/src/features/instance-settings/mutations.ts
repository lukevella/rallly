import "server-only";

import { prisma } from "@rallly/database";
import { updateTag } from "next/cache";
import { instanceSettingsTag } from "./constants";

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
