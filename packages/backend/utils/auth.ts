import { prisma } from "@rallly/database";

export const getSubscriptionStatus = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      subscription: {
        select: {
          active: true,
          periodEnd: true,
        },
      },
    },
  });

  if (user?.subscription?.active === true) {
    return {
      active: true,
      legacy: false,
    } as const;
  }

  const userPaymentData = await prisma.userPaymentData.findFirst({
    where: {
      userId,
      endDate: {
        gt: new Date(),
      },
    },
    select: {
      endDate: true,
    },
  });

  if (userPaymentData) {
    return {
      active: true,
      legacy: true,
    } as const;
  }

  return {
    active: false,
  } as const;
};
