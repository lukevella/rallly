import { accessibleBy } from "@casl/prisma";
import { prisma } from "@rallly/database";
import { cache } from "react";
import { loadUserAbility } from "@/data/user";
import type { SpaceMemberRole } from "@/features/spaces/schema";
import { fromDBRole, toDBRole } from "@/features/spaces/utils";

export type SpaceDTO = {
  id: string;
  name: string;
  ownerId: string;
  isPro: boolean;
  role: SpaceMemberRole;
};

export const loadSpaces = cache(async () => {
  const { user, ability } = await loadUserAbility();
  const spaces = await prisma.space.findMany({
    where: accessibleBy(ability).Space,
    include: {
      subscription: true,
      members: {
        where: {
          userId: user.id,
        },
        select: {
          role: true,
        },
      },
    },
  });

  return spaces
    .map((space) => {
      const role = space.members[0]?.role;

      if (!role) {
        console.warn(
          `User ${user.id} does not have access to space ${space.id}`,
        );
        return null;
      }

      return {
        id: space.id,
        name: space.name,
        ownerId: space.ownerId,
        isPro: Boolean(space.subscription?.active),
        role: fromDBRole(role),
      } satisfies SpaceDTO;
    })
    .filter(Boolean) as SpaceDTO[];
});

export const loadSpace = cache(async ({ id }: { id: string }) => {
  const spaces = await loadSpaces();
  const space = spaces.find((space) => space.id === id);

  if (!space) {
    const { user } = await loadUserAbility();
    throw new Error(`User ${user.id} does not have access to space ${id}`);
  }

  return space;
});

const loadDefaultSpace = cache(async () => {
  const { user } = await loadUserAbility();
  const spaces = await loadSpaces();
  const defaultSpace = spaces.find((space) => space.ownerId === user.id);

  if (!defaultSpace) {
    throw new Error(`User ${user.id} does not have access to any spaces`);
  }

  return defaultSpace;
});

export const loadActiveSpace = cache(async () => {
  const { user } = await loadUserAbility();

  if (user.activeSpaceId) {
    try {
      return await loadSpace({ id: user.activeSpaceId });
    } catch {
      console.warn(
        `User ${user.id} has an active space ID ${user.activeSpaceId} that does not exist or is no longer accessible`,
      );
    }
  }

  return await loadDefaultSpace();
});

export const loadSubscription = cache(async () => {
  const space = await loadActiveSpace();
  const subscription = await prisma.subscription.findUnique({
    where: {
      spaceId: space.id,
    },
    select: {
      id: true,
      active: true,
      amount: true,
      currency: true,
      interval: true,
      status: true,
      periodEnd: true,
      cancelAtPeriodEnd: true,
    },
  });

  return subscription;
});

export const loadPaymentMethods = cache(async () => {
  const { user } = await loadUserAbility();
  const paymentMethods = await prisma.paymentMethod.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      type: true,
      data: true,
    },
  });

  return paymentMethods;
});

type MemberDTO = {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: SpaceMemberRole;
};

export const loadMembers = cache(
  async ({
    page = 1,
    pageSize = 10,
    q,
    role,
  }: {
    page?: number;
    pageSize?: number;
    q?: string;
    role?: "all" | SpaceMemberRole;
  }) => {
    const space = await loadActiveSpace();

    const whereClause = {
      spaceId: space.id,
      ...(q
        ? {
            user: {
              OR: [
                {
                  name: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
                {
                  email: {
                    contains: q,
                    mode: "insensitive",
                  },
                },
              ],
            },
          }
        : {}),
      ...(role && role !== "all"
        ? {
            role: toDBRole(role),
          }
        : {}),
    };

    const [members, totalCount] = await Promise.all([
      prisma.spaceMember.findMany({
        where: whereClause,
        select: {
          id: true,
          userId: true,
          role: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.spaceMember.count({
        where: whereClause,
      }),
    ]);

    return {
      total: totalCount,
      data: members.map(
        (member) =>
          ({
            id: member.id,
            name: member.user.name,
            email: member.user.email,
            image: member.user.image ?? undefined,
            role: fromDBRole(member.role),
          }) satisfies MemberDTO,
      ),
      hasNextPage: page * pageSize < totalCount,
    };
  },
);
