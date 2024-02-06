import { prisma } from "@rallly/database";

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
