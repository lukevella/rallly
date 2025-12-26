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
  options: PollOption[];
};

export const createPoll = async ({
  userId,
  title,
  description,
  location,
  timeZone,
  options,
}: CreatePollParams) => {
  const spaceMember = await prisma.spaceMember.findFirst({
    where: { userId },
    orderBy: { lastSelectedAt: "desc" },
    select: { spaceId: true },
  });

  const poll = await prisma.poll.create({
    data: {
      id: nanoid(),
      title,
      description,
      location,
      timeZone,
      adminUrlId: nanoid(),
      participantUrlId: nanoid(),
      userId,
      watchers: { create: { userId } },
      options: { createMany: { data: options } },
      spaceId: spaceMember?.spaceId,
    },
    select: { id: true, title: true, location: true, description: true },
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
