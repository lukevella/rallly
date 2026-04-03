import "server-only";

import { prisma } from "@rallly/database";
import { createSpaceDTO } from "@/features/space/data";
import { getUser } from "@/features/user/data";
import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";

/**
 * Gets the current user if they are logged in, otherwise null.
 * @returns The current user if they are logged in, otherwise null.
 */
export const getCurrentUser = async () => {
  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    return null;
  }

  const user = await getUser(session.user.id);

  if (!user) {
    return null;
  }

  return user;
};

export const getCurrentUserSpace = async () => {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  // Get the most recently selected space via SpaceMember
  const spaceMember = await prisma.spaceMember.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      lastSelectedAt: "desc",
    },
    include: {
      space: true,
    },
  });

  if (!spaceMember) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Space not found",
    });
  }

  return {
    user,
    space: createSpaceDTO({
      ...spaceMember.space,
      role: spaceMember.role,
    }),
  };
};
