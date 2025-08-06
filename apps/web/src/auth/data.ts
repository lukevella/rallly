import "server-only";

import { prisma } from "@rallly/database";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createSpaceDTO } from "@/features/space/data";
import { getUser } from "@/features/user/data";
import { AppError } from "@/lib/errors";
import { auth } from "@/next-auth";
import { isInitialAdmin } from "@/utils/is-initial-admin";

export const getCurrentUser = async () => {
  const session = await auth();

  if (!session?.user) {
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
          subscription: {
            select: {
              active: true,
            },
          },
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
      subscription: spaceMember.space.subscription,
      role: spaceMember.role,
    }),
  };
};

export const requireAdmin = cache(async () => {
  const user = await requireUser();

  if (user.role !== "admin") {
    if (isInitialAdmin(user.email)) {
      return redirect("/admin-setup");
    }

    notFound();
  }
});

export const requireUser = cache(async () => {
  const session = await auth();
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "/";

  if (!session?.user) {
    const searchParams = new URLSearchParams();
    searchParams.set("redirectTo", pathname);
    redirect(`/login?${searchParams.toString()}`);
  }

  const user = await getUser(session.user.id);

  if (!user) {
    redirect("/api/auth/invalid-session");
  }

  return user;
});

export const requireSpace = cache(async () => {
  const user = await requireUser();

  const spaceMember = await prisma.spaceMember.findFirst({
    where: {
      userId: user.id,
    },
    orderBy: {
      lastSelectedAt: "desc",
    },
    include: {
      space: {
        include: {
          subscription: true,
          members: true,
        },
      },
    },
  });

  if (!spaceMember) {
    redirect("/setup");
  }

  return createSpaceDTO({
    id: spaceMember.space.id,
    ownerId: spaceMember.space.ownerId,
    name: spaceMember.space.name,
    subscription: spaceMember.space.subscription,
    role: spaceMember.role,
    image: spaceMember.space.image,
  });
});
