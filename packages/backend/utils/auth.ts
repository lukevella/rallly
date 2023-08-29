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
      expiresAt: user.subscription.periodEnd,
    };
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

  if (
    userPaymentData?.endDate &&
    userPaymentData.endDate.getTime() > Date.now()
  ) {
    return {
      active: true,
      legacy: true,
      expiresAt: userPaymentData.endDate,
    };
  }

  return {
    active: false,
  };
};
