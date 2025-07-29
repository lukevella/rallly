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

  if (user.activeSpaceId) {
    const space = await prisma.space.findUnique({
      where: {
        id: user.activeSpaceId,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        subscription: {
          select: {
            active: true,
          },
        },
        members: {
          where: {
            userId: user.id,
          },
          select: {
            role: true,
            userId: true,
          },
        },
      },
    });

    if (space) {
      return {
        user,
        space: createSpaceDTO(user.id, space),
      };
    }

    const defaultSpace = await prisma.space.findFirst({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        name: true,
        ownerId: true,
        subscription: {
          select: {
            active: true,
          },
        },
        members: {
          where: {
            userId: user.id,
          },
          select: {
            role: true,
            userId: true,
          },
        },
      },
    });

    if (defaultSpace) {
      return {
        user,
        space: createSpaceDTO(user.id, defaultSpace),
      };
    }
  }

  const space = await prisma.space.findFirst({
    where: {
      ownerId: user.id,
    },
    select: {
      id: true,
      name: true,
      ownerId: true,
      subscription: {
        select: {
          active: true,
        },
      },
      members: {
        where: {
          userId: user.id,
        },
        select: {
          role: true,
          userId: true,
        },
      },
    },
  });

  if (!space) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "Space not found",
    });
  }

  return {
    user,
    space: createSpaceDTO(user.id, space),
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

  if (user.activeSpaceId) {
    const space = await prisma.space.findUnique({
      where: {
        id: user.activeSpaceId,
      },
      include: {
        subscription: true,
        members: true,
      },
    });

    if (space) {
      return createSpaceDTO(user.id, space);
    }
    console.error("Could not find user's active space");
  }

  const space = await prisma.space.findFirst({
    where: {
      ownerId: user.id,
    },
    include: {
      subscription: true,
      members: true,
    },
  });

  if (!space) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "User does not own any spaces",
    });
  }

  return createSpaceDTO(user.id, space);
});
