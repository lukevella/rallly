import { accessibleBy } from "@casl/prisma";
import type { SpaceMemberRole } from "@rallly/database";
import { prisma } from "@rallly/database";
import { cache } from "react";
import { loadUserAbility } from "@/data/user";

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
        role,
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
