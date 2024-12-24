import { prisma } from "@rallly/database";

export const mergeGuestsIntoUser = async (
  userId: string,
  guestIds: string[],
) => {
  await prisma.poll.updateMany({
    where: {
      guestId: {
        in: guestIds,
      },
    },
    data: {
      guestId: null,
      userId: userId,
    },
  });

  await prisma.participant.updateMany({
    where: {
      guestId: {
        in: guestIds,
      },
    },
    data: {
      guestId: null,
      userId: userId,
    },
  });

  await prisma.comment.updateMany({
    where: {
      guestId: {
        in: guestIds,
      },
    },
    data: {
      guestId: null,
      userId: userId,
    },
  });
};
