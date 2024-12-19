import { prisma } from "@rallly/database";

export const mergeGuestsIntoUser = async (
  userId: string,
  guestIds: string[],
) => {
  await prisma.$transaction(async (tx) => {
    const updatePolls = tx.poll.updateMany({
      where: {
        userId: {
          in: guestIds,
        },
      },
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    const updateParticipants = tx.participant.updateMany({
      where: {
        userId: {
          in: guestIds,
        },
      },
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    const updateComments = tx.comment.updateMany({
      where: {
        userId: {
          in: guestIds,
        },
      },
      data: {
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });

    await Promise.all([updatePolls, updateParticipants, updateComments]);

    await tx.user.deleteMany({
      where: {
        id: {
          in: guestIds,
        },
      },
    });
  });
};
