import { prisma } from "@rallly/database";
import * as Sentry from "@sentry/node";

export const mergeGuestsIntoUser = async (
  email: string,
  guestIds: string[],
) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email,
    },
  });

  const userId = user?.id;

  if (!userId) {
    Sentry.captureMessage("Could not find user to merge guests into.");
    return;
  }

  await prisma.poll.updateMany({
    where: {
      userId: {
        in: guestIds,
      },
    },
    data: {
      userId: userId,
    },
  });

  await prisma.participant.updateMany({
    where: {
      userId: {
        in: guestIds,
      },
    },
    data: {
      userId: userId,
    },
  });

  await prisma.comment.updateMany({
    where: {
      userId: {
        in: guestIds,
      },
    },
    data: {
      userId: userId,
    },
  });
};
