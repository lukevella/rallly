import { prisma } from "@rallly/database";

export const hasPollAdminAccess = async (pollId: string, userId: string) => {
  const poll = await prisma.poll.findUnique({
    where: {
      id: pollId,
      OR: [{ userId: userId }, { space: { members: { some: { userId } } } }],
    },
  });

  return poll !== null;
};
