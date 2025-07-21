import { accessibleBy } from "@casl/prisma";
import type {
  SpaceMemberRole as DBSpaceMemberRole,
  Prisma,
} from "@rallly/database";
import { prisma } from "@rallly/database";
import { cache } from "react";
import { loadCurrentUser, loadCurrentUserSpace } from "@/auth/data";
import { defineAbilityFor } from "@/features/ability-manager";
import type { SpaceMemberRole } from "@/features/spaces/schema";
import { fromDBRole, toDBRole } from "@/features/spaces/utils";
import { AppError } from "@/lib/errors";
import { isSelfHosted } from "@/utils/constants";

function getSpaceTier(space: {
  subscription: {
    active: boolean;
  } | null;
}) {
  return isSelfHosted ? "pro" : space.subscription?.active ? "pro" : "hobby";
}

export function createSpaceDTO(
  userId: string,
  space: {
    id: string;
    ownerId: string;
    name: string;
    subscription: {
      active: boolean;
    } | null;
    members: {
      role: DBSpaceMemberRole;
      userId: string;
    }[];
  },
) {
  const role = space.members.find((member) => member.userId === userId)?.role;

  if (!role) {
    throw new AppError({
      code: "INTERNAL_SERVER_ERROR",
      message: "User is not a member of the space",
    });
  }

  return {
    id: space.id,
    name: space.name,
    ownerId: space.ownerId,
    tier: getSpaceTier(space),
    role: fromDBRole(role),
  } satisfies SpaceDTO;
}

export type SpaceDTO = {
  id: string;
  name: string;
  ownerId: string;
  tier: "hobby" | "pro";
  role: SpaceMemberRole;
};

export const loadSpaces = cache(async () => {
  const user = await loadCurrentUser();
  const ability = defineAbilityFor(user);
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
        tier: space.subscription?.active ? "pro" : "hobby",
        role: fromDBRole(role),
      } satisfies SpaceDTO;
    })
    .filter(Boolean) as SpaceDTO[];
});

export const loadSpace = cache(async ({ id }: { id: string }) => {
  const spaces = await loadSpaces();
  const space = spaces.find((space) => space.id === id);

  if (!space) {
    const user = await loadCurrentUser();
    throw new Error(`User ${user.id} does not have access to space ${id}`);
  }

  return space;
});

export const loadSubscription = cache(async () => {
  const { space } = await loadCurrentUserSpace();
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
  const user = await loadCurrentUser();
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
    const { space } = await loadCurrentUserSpace();

    const whereClause: Prisma.SpaceMemberWhereInput = {
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
