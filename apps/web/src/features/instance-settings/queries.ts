import "server-only";

import { prisma } from "@rallly/database";
import { unstable_cache } from "next/cache";
import { env } from "@/env";
import { instanceSettingsTag } from "./constants";

export const getInstanceSettings = unstable_cache(
  async () => {
    // If email login isn't enabled, its not possible to register:
    if (env.ALLOW_EMAIL_LOGIN !== "true") {
      return {
        disableUserRegistration: true,
        allowRegistrationChange: false,
      };
    }

    // Otherwise, check if the environment variable is configured:
    if (typeof env.ALLOW_EMAIL_REGISTRATION === "string") {
      return {
        disableUserRegistration: env.ALLOW_EMAIL_REGISTRATION === "false",
        allowRegistrationChange: false,
      };
    }

    // Else load from the database & allow changes:
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
      allowRegistrationChange: true,
    };
  },
  [],
  {
    tags: [instanceSettingsTag],
  }
);
