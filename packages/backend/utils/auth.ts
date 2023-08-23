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
        },
      },
    },
  });

  if (user?.subscription?.active === true) {
    return {
      active: true,
    };
  }

  const userPaymentData = await prisma.userPaymentData.findFirst({
    where: {
      userId,
      endDate: {
        gt: new Date(),
      },
    },
  });

  if (
    userPaymentData?.endDate &&
    userPaymentData.endDate.getTime() > Date.now()
  ) {
    return {
      active: true,
      legacy: true,
    };
  }

  return {
    active: false,
  };
};
