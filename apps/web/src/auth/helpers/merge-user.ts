import { defineAbilityFor } from "@/features/ability-manager";
import { getUser } from "@/features/user/queries";
import { accessibleBy } from "@casl/prisma";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";

const getActiveSpaceForUser = async ({
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

  return await prisma.space.findFirst({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
};

export const mergeGuestsIntoUser = async (
  userId: string,
  guestIds: string[],
) => {
  const space = await getActiveSpaceForUser({ userId });
  const guestId = guestIds[0];
  if (!space || !guestId) {
    console.error(`User ${userId} has no active space or default space`);
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.poll.updateMany({
          where: {
            guestId,
          },
          data: {
            guestId: null,
            userId: userId,
            spaceId: space.id,
          },
        }),

        tx.participant.updateMany({
          where: {
            guestId,
          },
          data: {
            guestId: null,
            userId: userId,
          },
        }),

        tx.comment.updateMany({
          where: {
            guestId,
          },
          data: {
            guestId: null,
            userId: userId,
          },
        }),
      ]);
    });
    posthog?.capture({
      distinctId: userId,
      event: "$merge_dangerously",
      properties: { alias: guestId },
    });
  } catch (error) {
    Sentry.captureException(error);
  }
};
