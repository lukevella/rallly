import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import * as Sentry from "@sentry/nextjs";

const getActiveSpaceForUser = async ({ userId }: { userId: string }) => {
  const spaceMember = await prisma.spaceMember.findFirst({
    where: {
      userId,
    },
    select: {
      spaceId: true,
    },
    orderBy: {
      lastSelectedAt: "desc",
    },
  });

  return spaceMember?.spaceId;
};

export const mergeGuestsIntoUser = async (
  userId: string,
  guestIds: string[],
) => {
  const spaceId = await getActiveSpaceForUser({ userId });
  const guestId = guestIds[0];
  if (!spaceId || !guestId) {
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
            spaceId,
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
