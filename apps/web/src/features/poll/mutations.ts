import { prisma } from "@rallly/database";
import { absoluteUrl, shortUrl } from "@rallly/utils/absolute-url";
import { nanoid } from "@rallly/utils/nanoid";

export type PollOption = {
  startTime: Date;
  duration: number;
};

export type CreatePollParams = {
  userId: string;
  title: string;
  description?: string;
  location?: string;
  timeZone?: string;
  requireParticipantEmail?: boolean;
  hideParticipants?: boolean;
  hideScores?: boolean;
  disableComments?: boolean;
  options: PollOption[];
  spaceId: string;
};

export const createPoll = async ({
  userId,
  title,
  description,
  location,
  timeZone,
  requireParticipantEmail,
  hideParticipants,
  hideScores,
  disableComments,
  options,
  spaceId,
}: CreatePollParams) => {
  const poll = await prisma.poll.create({
    data: {
      id: nanoid(),
      title,
      description,
      location,
      timeZone,
      requireParticipantEmail,
      hideParticipants,
      hideScores,
      disableComments,
      adminUrlId: nanoid(),
      participantUrlId: nanoid(),
      userId,
      watchers: { create: { userId } },
      spaceId,
      options: { createMany: { data: options } },
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      timeZone: true,
      status: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      options: {
        select: {
          id: true,
          startTime: true,
          duration: true,
        },
        orderBy: {
          startTime: "asc",
        },
      },
    },
  });

  return {
    ...poll,
    adminUrl: absoluteUrl(`/poll/${poll.id}`),
    inviteUrl: shortUrl(`/invite/${poll.id}`),
  };
};

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
