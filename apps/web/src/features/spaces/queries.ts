import { accessibleBy } from "@casl/prisma";
import type { SpaceMemberRole } from "@rallly/database";
import { prisma } from "@rallly/database";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireUserAbility } from "@/auth/queries";

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
        role,
      } satisfies SpaceDTO;
    })
    .filter(Boolean) as SpaceDTO[];
});

export const loadDefaultSpace = cache(async () => {
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
    role: "OWNER" as const,
  } satisfies SpaceDTO;
});

/**
 * Loads a specific space by ID using the cached list of spaces
 * This is more efficient than querying the database directly
 */
export const loadSpace = cache(async ({ id }: { id: string }) => {
  const spaces = await loadSpaces();
  const space = spaces.find((space) => space.id === id);

  if (!space) {
    const { user } = await requireUserAbility();
    throw new Error(`User ${user.id} does not have access to space ${id}`);
  }

  return space;
});
