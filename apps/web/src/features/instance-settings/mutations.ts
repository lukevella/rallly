import "server-only";

import { prisma } from "@rallly/database";
import { updateTag } from "next/cache";
import { instanceSettingsTag } from "./constants";

export type UpdateInstanceSettingsInput = {
  disableUserRegistration?: boolean;
  appName?: string | null;
  primaryColor?: string | null;
  primaryColorDark?: string | null;
  logoUrl?: string | null;
  logoUrlDark?: string | null;
  logoIconUrl?: string | null;
  hideAttribution?: boolean | null;
};

export async function updateInstanceSettings(
  data: UpdateInstanceSettingsInput,
) {
  await prisma.instanceSettings.update({
    where: {
      id: 1,
    },
    data,
  });

  updateTag(instanceSettingsTag);
}
