import "server-only";

import { prisma } from "@rallly/database";

export const getUserCount = async () => {
  "use cache";
  const userCount = await prisma.user.count({
    where: {
      isAnonymous: false,
    },
  });
  return userCount;
};
