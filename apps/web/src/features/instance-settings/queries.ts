"server-only";
import { prisma } from "@rallly/database";
import { cache } from "react";

export const getInstanceSettings = cache(async () => {
  const instanceSettings = await prisma.instanceSettings.findFirst({
    select: {
      disableUserRegistration: true,
    },
  });

  return {
    disableUserRegistration: instanceSettings?.disableUserRegistration ?? false,
  };
});
