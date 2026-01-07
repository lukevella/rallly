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
  spaceId?: string;
  spaceOwnerId?: string;
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
  spaceOwnerId,
}: CreatePollParams) => {
  // If spaceId and spaceOwnerId are provided, use them directly
  // Otherwise, fall back to looking up the user's most recent space
  const finalUserId = spaceOwnerId ?? userId;
  const finalSpaceId =
    spaceId ??
    (
      await prisma.spaceMember.findFirst({
        where: { userId },
        orderBy: { lastSelectedAt: "desc" },
        select: { spaceId: true },
      })
    )?.spaceId;

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
      userId: finalUserId,
      watchers: { create: { userId: finalUserId } },
      options: { createMany: { data: options } },
      spaceId: finalSpaceId,
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
