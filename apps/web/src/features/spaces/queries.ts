import { defineAbilityFor } from "@/features/ability-manager";
import { getUser } from "@/features/user/queries";
import { accessibleBy } from "@casl/prisma";
import { prisma } from "@rallly/database";
import { cache } from "react";

export const listSpaces = cache(
  async ({
    userId,
  }: {
    userId: string;
  }) => {
    const spaces = await prisma.spaceMember.findMany({
      where: {
        userId,
      },
      include: { space: true },
    });

    return spaces.map((spaceMember) => ({
      ...spaceMember.space,
      role: spaceMember.role,
    }));
  },
);

export const getActiveSpaceForUser = cache(
  async ({
    userId,
  }: {
    userId: string;
  }) => {
    const user = await getUser(userId);

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const ability = defineAbilityFor(user);

    if (user.activeSpaceId) {
      const space = await prisma.space.findFirst({
        where: {
          AND: [accessibleBy(ability).Space, { id: user.activeSpaceId }],
        },
      });

      if (space) {
        return space;
      }
    }

    return getDefaultSpace({ ownerId: user.id });
  },
);

export const getDefaultSpace = cache(
  async ({
    ownerId,
  }: {
    ownerId: string;
  }) => {
    const space = await prisma.space.findFirst({
      where: {
        ownerId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!space) {
      throw new Error(`Space with owner ID ${ownerId} not found`);
    }

    return space;
  },
);

export const getSpace = cache(async ({ id }: { id: string }) => {
  return await prisma.space.findUnique({
    where: {
      id,
    },
  });
});
