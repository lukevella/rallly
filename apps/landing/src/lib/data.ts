import "server-only";

import { prisma } from "@rallly/database";
import { unstable_cache } from "next/cache";

export const getUserCount = unstable_cache(
  async () => {
    const userCount = await prisma.user.count({
      where: {
        isAnonymous: false,
      },
    });
    return userCount;
  },
  ["user-count"],
  {
    revalidate: false,
  },
);
