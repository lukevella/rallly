import "server-only";

import { prisma } from "@rallly/database";
import { notFound, redirect } from "next/navigation";
import { cache } from "react";
import { createSpaceDTO } from "@/data/space";
import { createUserDTO } from "@/data/user";
import { AppError } from "@/lib/errors";
import { auth } from "@/next-auth";

export const getCurrentUser = async () => {
  const session = await auth();

  if (!session?.user) {
    throw new AppError({
      code: "UNAUTHORIZED",
      message: "User not authenticated",
    });
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
  });

  if (!user) {
    throw new AppError({
      code: "NOT_FOUND",
      message: "User not found",
    });
  }

  return createUserDTO(user);
};

export const loadCurrentUser = cache(async () => {
  try {
    return getCurrentUser();
  } catch (error) {
    if (error instanceof AppError) {
      switch (error.code) {
        case "NOT_FOUND":
          redirect("/api/auth/invalid-session");
          break;
        case "UNAUTHORIZED":
          redirect("/login");
          break;
        default:
          throw error;
      }
    }
    throw error;
  }
});

export const getCurrentUserSpace = async () => {
  const user = await getCurrentUser();

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

export const loadCurrentUserSpace = cache(async () => {
  try {
    return getCurrentUserSpace();
  } catch (error) {
    if (error instanceof AppError) {
      switch (error.code) {
        case "NOT_FOUND":
          redirect("/api/auth/invalid-session");
          break;
        case "UNAUTHORIZED":
          redirect("/login");
          break;
        default:
          throw error;
      }
    }
    throw error;
  }
});

export const requireAdmin = cache(async () => {
  const user = await loadCurrentUser();

  if (user.role !== "admin") {
    notFound();
  }
});
