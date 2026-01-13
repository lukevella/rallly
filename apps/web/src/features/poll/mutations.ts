import { prisma } from "@rallly/database";

export const deletePoll = async (pollId: string, spaceId: string) => {
  const poll = await prisma.poll.findFirst({
    where: {
      id: pollId,
      spaceId,
      deletedAt: null,
    },
    select: { id: true },
  });

  if (!poll) {
    return null;
  }

  await prisma.poll.update({
    where: { id: pollId },
    data: { deleted: true, deletedAt: new Date() },
  });

  return { id: pollId };
};
