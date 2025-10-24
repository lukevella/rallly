import { prisma } from "@rallly/database";

export const getUserCount = async () => {
  return await prisma.user.count();
};

export const getUserHasPassword = async (userId: string) => {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "credential",
    },
  });
  return !!account;
};

export const getUserHasNoAccounts = async (userId: string) => {
  const accountCount = await prisma.account.count({
    where: {
      userId,
    },
  });
  return accountCount === 0;
};
