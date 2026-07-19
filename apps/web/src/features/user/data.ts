import "server-only";

import type { User } from "@rallly/database";
import { prisma } from "@rallly/database";
import { cache } from "react";
import type { UserDTO } from "@/features/user/schema";
import { getSession } from "@/lib/auth";
import { InvalidSessionError } from "@/lib/errors/invalid-session-error";

export const createUserDTO = (user: User): UserDTO => ({
  id: user.id,
  name: user.name,
  image: user.image ?? undefined,
  email: user.email,
  role: user.role,
  banned: user.banned,
  timeZone: user.timeZone || undefined,
  timeFormat: user.timeFormat ?? undefined,
  locale: user.locale ?? undefined,
  weekStart: user.weekStart ?? undefined,
  customerId: user.customerId ?? undefined,
  isGuest: user.isAnonymous,
  deletedAt: user.deletedAt ?? undefined,
});

/**
 * The current signed-in user, fetched from the database. Returns null
 * when there is no session or the user is a guest — the caller decides
 * how to respond (redirect, 401, etc.). Throws InvalidSessionError when
 * the session references a user that no longer exists or is banned.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession();

  if (!session?.user || session.user.isGuest) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || user.banned) {
    throw new InvalidSessionError();
  }

  return createUserDTO(user);
});

export function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      image: true,
    },
  });
}

export const getUserCount = async () => {
  return await prisma.user.count({
    where: {
      isAnonymous: false,
    },
  });
};

export async function getUserDeletionDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      customerId: true,
      _count: {
        select: { subscriptions: { where: { active: true } } },
      },
    },
  });

  if (!user) {
    return null;
  }

  return {
    email: user.email,
    customerId: user.customerId,
    hasActiveSubscription: user._count.subscriptions > 0,
  };
}

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
