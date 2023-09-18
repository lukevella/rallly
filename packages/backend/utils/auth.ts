import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";

export type UserInfo = {
  id: string;
  name: string;
  email: string;
  hasActiveSubscription: boolean;
  subscriptionEndDate?: Date;
  legacyBilling: boolean;
};

export const getUserInfo = async (userId: string): Promise<UserInfo> => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      subscription: {
        select: {
          active: true,
          periodEnd: true,
        },
      },
    },
  });

  if (!user) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
  }

  const res = {
    id: user.id,
    name: user.name,
    email: user.email,
  };

  if (user.subscription?.active === true) {
    return {
      ...res,
      legacyBilling: false,
      hasActiveSubscription: true,
      subscriptionEndDate: user.subscription.periodEnd,
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

  if (userPaymentData) {
    return {
      ...res,
      legacyBilling: true,
      hasActiveSubscription: true,
      subscriptionEndDate: userPaymentData.endDate,
    };
  }

  return { ...res, hasActiveSubscription: false, legacyBilling: false };
};
