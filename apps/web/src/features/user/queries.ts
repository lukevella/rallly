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
