import { prisma } from "@rallly/database";

export const mergeGuestsIntoUser = async (
  userId: string,
  guestIds: string[],
) => {
  const userCount = await prisma.user.count({
    where: {
      id: userId,
    },
  });

  const doesUserExist = userCount > 0;

  return await prisma.$transaction(async (tx) => {
    await Promise.all([
      tx.poll.updateMany({
        where: {
          guestId: {
            in: guestIds,
          },
        },
        data: {
          guestId: doesUserExist ? null : userId,
          userId: doesUserExist ? userId : null,
        },
      }),

      tx.participant.updateMany({
        where: {
          guestId: {
            in: guestIds,
          },
        },
        data: {
          guestId: doesUserExist ? null : userId,
          userId: doesUserExist ? userId : null,
        },
      }),

      tx.comment.updateMany({
        where: {
          guestId: {
            in: guestIds,
          },
        },
        data: {
          guestId: doesUserExist ? null : userId,
          userId: doesUserExist ? userId : null,
        },
      }),
    ]);
  });
};
