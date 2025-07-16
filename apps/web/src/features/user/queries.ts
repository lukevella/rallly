import { prisma } from "@rallly/database";

import { isSelfHosted } from "@/utils/constants";

export const getUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      locale: true,
      timeZone: true,
      timeFormat: true,
      weekStart: true,
      role: true,
      activeSpaceId: true,
      customerId: true,
      subscription: {
        select: {
          active: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    image: user.image ?? undefined,
    locale: user.locale ?? undefined,
    timeZone: user.timeZone ?? undefined,
    timeFormat: user.timeFormat ?? undefined,
    weekStart: user.weekStart ?? undefined,
    customerId: user.customerId ?? undefined,
    isPro: Boolean(isSelfHosted || user.subscription?.active),
  };
};

export const getUserCount = async () => {
  return await prisma.user.count();
};
