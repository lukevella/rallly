import { prisma } from "@rallly/database";

export const mergeGuestsIntoUser = async (
  userId: string,
  guestIds: string[],
) => {
  return await prisma.$transaction(async (tx) => {
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
};

export const temporarilyMigrateData = async (
  providerId: string,
  guestIds: string[],
) => {
  return await prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.poll.updateMany({
        where: {
          guestId: {
            in: guestIds,
          },
        },
        data: {
          guestId: providerId,
        },
      }),

      tx.participant.updateMany({
        where: {
          guestId: {
            in: guestIds,
          },
        },
        data: {
          guestId: providerId,
        },
      }),

      tx.comment.updateMany({
        where: {
          guestId: {
            in: guestIds,
          },
        },
        data: {
          guestId: providerId,
        },
      }),
    ]);
  });
};
