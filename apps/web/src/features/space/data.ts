import { accessibleBy } from "@casl/prisma";
import type {
  SpaceMemberRole as DBSpaceMemberRole,
  Prisma,
} from "@rallly/database";
import { prisma } from "@rallly/database";
import { cache } from "react";
import { requireUser, requireUserWithSpace } from "@/auth/data";
import type { MemberDTO } from "@/features/space/member/types";
import type { MemberRole } from "@/features/space/schema";
import type { SpaceDTO } from "@/features/space/types";
import { fromDBRole, toDBRole } from "@/features/space/utils";
import { defineAbilityFor } from "@/features/user/ability";
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

export const loadSpaces = cache(async () => {
  const user = await requireUser();
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
    const user = await requireUser();
    throw new Error(`User ${user.id} does not have access to space ${id}`);
  }

  return space;
});

export const loadSubscription = cache(async () => {
  const { space } = await requireUserWithSpace();
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
  const user = await requireUser();
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
    role?: "all" | MemberRole;
  }) => {
    const { space } = await requireUserWithSpace();

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
            isOwner: member.userId === space.ownerId,
          }) satisfies MemberDTO,
      ),
      hasNextPage: page * pageSize < totalCount,
    };
  },
);
