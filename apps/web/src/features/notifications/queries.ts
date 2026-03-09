import { prisma } from "@rallly/database";

import { defaultNotificationPreferences } from "./constants";
import type { ActivityEventType, NotificationPreferences } from "./schema";
import { notificationPreferencesSchema } from "./schema";

function parsePrefs(prefs: unknown): NotificationPreferences {
  const parsed = notificationPreferencesSchema.safeParse(prefs);
  return {
    ...defaultNotificationPreferences,
    ...(parsed.success ? parsed.data : {}),
  };
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const row = await prisma.userNotificationPreferences.findUnique({
    where: { userId },
    select: { prefs: true },
  });

  return parsePrefs(row?.prefs);
}

type NotificationRecipient = {
  id: string;
  email: string;
  locale: string | null;
};

/**
 * Get the poll creator if they should receive a notification for this event.
 * Returns null if the creator has notifications disabled or is the one who
 * triggered the event.
 */
export async function getNotificationRecipient({
  pollId,
  type,
  excludeUserId,
}: {
  pollId: string;
  type: ActivityEventType;
  excludeUserId: string;
}): Promise<NotificationRecipient | null> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { userId: true, muted: true },
  });

  if (!poll?.userId || poll.userId === excludeUserId || poll.muted) {
    return null;
  }

  const creator = await prisma.user.findUnique({
    where: { id: poll.userId, isAnonymous: false },
    select: {
      id: true,
      email: true,
      locale: true,
      notificationPreferences: {
        select: { prefs: true },
      },
    },
  });

  if (!creator) {
    return null;
  }

  const prefs = parsePrefs(creator.notificationPreferences?.prefs);

  if (!prefs[type]) {
    return null;
  }

  return {
    id: creator.id,
    email: creator.email,
    locale: creator.locale,
  };
}
