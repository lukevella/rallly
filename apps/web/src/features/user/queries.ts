import { prisma } from "@rallly/database";

export const getUserCount = async () => {
  return await prisma.user.count();
};
