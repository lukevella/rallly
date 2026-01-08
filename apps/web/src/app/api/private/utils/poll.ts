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
    select: { id: true },
  });

  return {
    id: poll.id,
    adminUrl: absoluteUrl(`/poll/${poll.id}`),
    inviteUrl: shortUrl(`/invite/${poll.id}`),
  };
};

export const apiError = (code: string, message: string) => ({
  error: { code, message },
});
