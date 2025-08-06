import { prisma } from "@rallly/database";

export const userHasSpaces = async (userId: string): Promise<boolean> => {
  const spaceCount = await prisma.spaceMember.count({
    where: {
      userId: userId,
    },
  });
  return spaceCount > 0;
};
