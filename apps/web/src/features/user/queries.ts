import { prisma } from "@rallly/database";
import { cache } from "react";

import { isSelfHosted } from "@/utils/constants";

export const getUser = cache(async (userId: string) => {
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
    isPro: Boolean(isSelfHosted || user.subscription?.active),
  };
});

export const getUserCount = cache(async () => {
  return await prisma.user.count();
});
