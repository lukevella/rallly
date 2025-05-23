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
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image ?? undefined,
    locale: user.locale ?? undefined,
    timeZone: user.timeZone ?? undefined,
    timeFormat: user.timeFormat ?? undefined,
    weekStart: user.weekStart ?? undefined,
    role: user.role,
    isPro: Boolean(isSelfHosted || user.subscription?.active),
  };
});

export const getAdminCount = cache(async () => {
  return prisma.user.count({
    where: {
      role: "admin",
    },
  });
});

export const hasAdmins = async () => {
  return (await getAdminCount()) > 0;
};

export const getUserCount = cache(async () => {
  return await prisma.user.count();
});
