import { prisma } from "@rallly/database";

import { isSelfHosted } from "./constants";

export const getSubscriptionStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      subscription: {
        select: {
          active: true,
        },
      },
    },
  });

  return {
    active: user?.subscription?.active === true || isSelfHosted,
  };
};
