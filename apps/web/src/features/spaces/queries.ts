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
