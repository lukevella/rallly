import { getUser } from "@/features/user/queries";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";

export const mergeGuestsIntoUser = async (
  userId: string,
  guestIds: string[],
) => {
  let spaceId: string;
  const user = await getUser(userId);

  if (!user) {
    console.error(`User ${userId} not found`);
    return;
  }

  if (user.activeSpaceId) {
    spaceId = user.activeSpaceId;
  } else {
    const defaultSpace = await prisma.space.findFirst({
      where: {
        ownerId: user.id,
      },
    });

    if (!defaultSpace) {
      console.error(`User ${userId} has no default space`);
      return;
    }

    spaceId = defaultSpace.id;
  }

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
            spaceId: spaceId,
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
