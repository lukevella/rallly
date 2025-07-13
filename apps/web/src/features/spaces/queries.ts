import { requireUserAbility } from "@/auth/queries";
import { accessibleBy } from "@casl/prisma";
import { prisma } from "@rallly/database";
import { cache } from "react";

export const listSpaces = cache(async () => {
  const { ability } = await requireUserAbility();
  const spaces = await prisma.spaceMember.findMany({
    where: accessibleBy(ability).SpaceMember,
    include: { space: true },
  });

  return spaces.map((spaceMember) => ({
    ...spaceMember.space,
    role: spaceMember.role,
  }));
});

export const getDefaultSpace = cache(async () => {
  const { user } = await requireUserAbility();
  const space = await prisma.space.findFirst({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!space) {
    throw new Error(`Space with owner ID ${user.id} not found`);
  }

  return space;
});

export const getSpace = cache(async ({ id }: { id: string }) => {
  return await prisma.space.findFirst({
    where: {
      id,
    },
  });
});
