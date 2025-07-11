import { defineAbilityFor } from "@/features/ability-manager";
import { getDefaultSpace } from "@/features/spaces/queries";
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

  return getDefaultSpace({ ownerId: user.id });
};

export const mergeGuestsIntoUser = async (
  userId: string,
  guestIds: string[],
) => {
  const space = await getActiveSpaceForUser({ userId });

  try {
    await prisma.$transaction(async (tx) => {
      await Promise.all([
        tx.poll.updateMany({
          where: {
            guestId: {
              in: guestIds,
            },
          },
          data: {
            guestId: null,
            userId: userId,
            spaceId: space.id,
          },
        }),

        tx.participant.updateMany({
          where: {
            guestId: {
              in: guestIds,
            },
          },
          data: {
            guestId: null,
            userId: userId,
          },
        }),

        tx.comment.updateMany({
          where: {
            guestId: {
              in: guestIds,
            },
          },
          data: {
            guestId: null,
            userId: userId,
          },
        }),
      ]);
    });
    posthog?.alias({ distinctId: userId, alias: guestIds[0] });
  } catch (error) {
    Sentry.captureException(error);
  }
};
