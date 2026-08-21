import "server-only";

import type { Prisma, User } from "@rallly/database";
import { prisma } from "@rallly/database";
import type {
  InactivityPeriod,
  UserDTO,
  UserRole,
  UserSort,
} from "@/features/user/schema";
import { getInactivityCutoff } from "@/features/user/utils";

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

export const getUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return null;
  }

  return createUserDTO(user);
};

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

export const isEmailTaken = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true },
  });
  return !!user;
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

export const getUserHasNoAccounts = async (userId: string) => {
  const accountCount = await prisma.account.count({
    where: {
      userId,
    },
  });
  return accountCount === 0;
};

/**
 * Paginated user directory for the control panel.
 *
 * `inactiveFor` is classified against the current time, so callers must keep
 * this read request-bound (behind connection()) rather than prerendering it.
 */
export async function getUsers({
  page,
  pageSize,
  q,
  role,
  inactiveFor,
  sort,
}: {
  page: number;
  pageSize: number;
  q?: string;
  role?: UserRole;
  inactiveFor?: InactivityPeriod;
  sort: UserSort;
}) {
  const where: Prisma.UserWhereInput = {
    isAnonymous: false,
  };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (inactiveFor) {
    where.lastSeenAt = { lt: getInactivityCutoff(inactiveFor, new Date()) };
  }

  const orderBy: Prisma.UserOrderByWithRelationInput =
    sort === "leastRecentlyActive"
      ? { lastSeenAt: "asc" }
      : { createdAt: "desc" };

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        banned: true,
        lastSeenAt: true,
      },
      take: pageSize,
      skip: (page - 1) * pageSize,
      where,
      orderBy,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, totalUsers };
}
