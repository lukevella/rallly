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
    } as const;
  }

  return {
    active: false,
  } as const;
};
