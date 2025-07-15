import { requireUserAbility } from "@/auth/queries";
import { accessibleBy } from "@casl/prisma";
import { type SpaceMemberRole, prisma } from "@rallly/database";
import { redirect } from "next/navigation";
import { cache } from "react";

export type SpaceDTO = {
  id: string;
  name: string;
  ownerId: string;
  isPro: boolean;
  role: SpaceMemberRole;
};

export const loadSpaces = cache(async () => {
  const { user, ability } = await requireUserAbility();
  const spaces = await prisma.space.findMany({
    where: accessibleBy(ability).Space,
    include: {
      subscription: true,
      members: true,
    },
  });

  const availableSpaces: SpaceDTO[] = [];

  for (const space of spaces) {
    const role = space.members.find(
      (member) => member.userId === user.id,
    )?.role;

    if (!role) {
      console.warn(`User ${user.id} does not have access to space ${space.id}`);
      continue;
    }

    availableSpaces.push({
      id: space.id,
      name: space.name,
      ownerId: space.ownerId,
      isPro: Boolean(space.subscription?.active),
      role,
    });
  }

  return availableSpaces;
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
    include: {
      subscription: true,
    },
  });

  if (!space) {
    redirect("/setup");
  }

  return {
    id: space.id,
    name: space.name,
    ownerId: space.ownerId,
    isPro: Boolean(space.subscription?.active),
    role: "OWNER",
  } satisfies SpaceDTO;
});

export const getSpace = cache(async ({ id }: { id: string }) => {
  const { user, ability } = await requireUserAbility();
  const space = await prisma.space.findFirst({
    where: {
      AND: [accessibleBy(ability).Space, { id }],
    },
    include: {
      subscription: {
        where: {
          active: true,
        },
      },
      members: {
        where: {
          userId: user.id,
        },
      },
    },
  });

  if (!space) {
    throw new Error(`User ${user.id} does not have access to space ${id}`);
  }

  const role = space.members.find((member) => member.userId === user.id)?.role;

  if (!role) {
    throw new Error(`User ${user.id} is not a member of space ${id}`);
  }

  return {
    id: space.id,
    name: space.name,
    ownerId: space.ownerId,
    isPro: Boolean(space.subscription?.active),
    role,
  } satisfies SpaceDTO;
});
