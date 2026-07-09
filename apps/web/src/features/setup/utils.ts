import "server-only";

import { prisma } from "@rallly/database";

export function isInitialAdmin(email: string) {
  return (
    process.env.INITIAL_ADMIN_EMAIL &&
    email.toLowerCase() === process.env.INITIAL_ADMIN_EMAIL.toLowerCase()
  );
}

export const userHasSpaces = async (userId: string): Promise<boolean> => {
  const spaceCount = await prisma.spaceMember.count({
    where: {
      userId: userId,
    },
  });
  return spaceCount > 0;
};
