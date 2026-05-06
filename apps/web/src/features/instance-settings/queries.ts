import "server-only";

import { prisma } from "@rallly/database";
import { cacheTag } from "next/cache";
import { instanceSettingsTag } from "./constants";

export const getInstanceSettings = async () => {
  "use cache";
  cacheTag(instanceSettingsTag);
  const instanceSettings = await prisma.instanceSettings.findUnique({
    where: {
      id: 1,
    },
    select: {
      disableUserRegistration: true,
    },
  });

  return {
    disableUserRegistration: instanceSettings?.disableUserRegistration ?? false,
  };
};
