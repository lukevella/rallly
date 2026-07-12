import "server-only";
import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import * as Sentry from "@sentry/nextjs";
import { posthog } from "@/lib/posthog";

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

export const linkAnonymousUser = async (
  authenticatedUserId: string,
  anonymousUserId: string,
) => {
  try {
    // Claim event registrations made with the account's own email. A
    // registration's email is its identity (the host's record), so it must
    // not be reassigned to an account that doesn't control that address —
    // only the ones whose email matches follow the user. This is scoped
    // independently of the space because a freshly created account may not
    // have its space provisioned yet.
    const authenticatedUser = await prisma.user.findUnique({
      where: { id: authenticatedUserId },
      select: { email: true },
    });

    if (authenticatedUser?.email) {
      await prisma.scheduledEventInvite.updateMany({
        where: {
          inviteeId: anonymousUserId,
          inviteeEmail: authenticatedUser.email,
        },
        data: {
          inviteeId: authenticatedUserId,
        },
      });
    }

    const spaceId = await getActiveSpaceForUser({
      userId: authenticatedUserId,
    });

    if (spaceId) {
      await prisma.$transaction(async (tx) => {
        // Transfer space-scoped data from anonymous user to authenticated user
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
    } else {
      logger.error(
        { userId: authenticatedUserId },
        "User has no active space; skipped poll/participant/comment migration",
      );
    }

    // Merge user identities in PostHog
    posthog()?.capture({
      distinctId: authenticatedUserId,
      event: "$merge_dangerously",
      properties: { alias: anonymousUserId },
    });
  } catch (error) {
    Sentry.captureException(error);
  }
};
