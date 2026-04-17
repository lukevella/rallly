import "server-only";

import { getProPricing } from "@rallly/billing";
import { prisma } from "@rallly/database";

export async function getUserCount() {
  "use cache";
  const userCount = await prisma.user.count({
    where: {
      isAnonymous: false,
    },
  });
  return userCount;
}

export async function getProPricingCached() {
  "use cache";
  return getProPricing();
}
