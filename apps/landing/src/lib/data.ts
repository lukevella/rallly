import "server-only";

import { prisma } from "@rallly/database";
import { cacheLife } from "next/cache";

export const getUserCount = async () => {
  "use cache";
  cacheLife("days");
  const userCount = await prisma.user.count({
    where: {
      isAnonymous: false,
    },
  });
  return userCount;
};
