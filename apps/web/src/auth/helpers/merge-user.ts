import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { PostHogClient } from "@/features/analytics/posthog";

const logger = createLogger("auth/merge-user");

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

export const mergeGuestsIntoUser = async (userId: string, guestId: string) => {
  const spaceId = await getActiveSpaceForUser({ userId });

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

    const posthog = PostHogClient();

    posthog?.capture({
      distinctId: userId,
      event: "$merge_dangerously",
      properties: { alias: guestId },
    });

    if (posthog) {
      waitUntil(posthog.shutdown());
    }
  } catch (error) {
    Sentry.captureException(error);
  }
};

export const linkAnonymousUser = async (
  authenticatedUserId: string,
  anonymousUserId: string,
) => {
  const spaceId = await getActiveSpaceForUser({ userId: authenticatedUserId });

  if (!spaceId) {
    logger.error({ userId: authenticatedUserId }, "User has no active space");
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Transfer all data from anonymous user to authenticated user
      await Promise.all([
        // Transfer polls
        tx.poll.updateMany({
          where: {
            userId: anonymousUserId,
          },
          data: {
            userId: authenticatedUserId,
            spaceId,
          },
        }),

        // Transfer participants
        tx.participant.updateMany({
          where: {
            userId: anonymousUserId,
          },
          data: {
            userId: authenticatedUserId,
          },
        }),

        // Transfer comments
        tx.comment.updateMany({
          where: {
            userId: anonymousUserId,
          },
          data: {
            userId: authenticatedUserId,
          },
        }),
      ]);
    });

    const posthog = PostHogClient();
    // Merge user identities in PostHog
    posthog?.capture({
      distinctId: authenticatedUserId,
      event: "$merge_dangerously",
      properties: { alias: anonymousUserId },
    });

    if (posthog) {
      waitUntil(posthog.shutdown());
    }
  } catch (error) {
    Sentry.captureException(error);
  }
};
