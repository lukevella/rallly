import "server-only";

import { prisma } from "@rallly/database";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createSpaceDTO } from "@/features/space/data";
import { getUser } from "@/features/user/data";
import { getSession } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { createPrivateSSRHelper } from "@/trpc/server/create-ssr-helper";
import { isInitialAdmin } from "@/utils/is-initial-admin";

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
      space: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          tier: true,
        },
      },
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
      id: spaceMember.space.id,
      ownerId: spaceMember.space.ownerId,
      name: spaceMember.space.name,
      tier: spaceMember.space.tier,
      role: spaceMember.role,
    }),
  };
};

export const requireAdmin = cache(async () => {
  const helpers = await createPrivateSSRHelper();
  const user = await helpers.user.getMe.fetch();

  if (!user) {
    redirect("/api/auth/invalid-session");
  }

  if (user.role !== "admin") {
    if (isInitialAdmin(user.email)) {
      redirect("/control-panel/setup");
    }

    notFound();
  }

  return user;
});
