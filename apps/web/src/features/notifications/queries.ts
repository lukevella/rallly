import { prisma } from "@rallly/database";

import { defaultNotificationPreferences } from "./constants";
import type {
  ActivityEventType,
  NotificationPreferences,
  NotificationScope,
} from "./schema";
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
 * Get the list of users who should receive a notification for a poll event.
 *
 * @param pollId - The poll that triggered the event
 * @param type - The notification event type (determines which preference to check)
 * @param excludeUserId - The user who triggered the event (excluded from recipients)
 */
export async function getNotificationRecipients({
  pollId,
  type,
  excludeUserId,
}: {
  pollId: string;
  type: ActivityEventType;
  excludeUserId: string;
}): Promise<NotificationRecipient[]> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      userId: true,
      spaceId: true,
    },
  });

  if (!poll) {
    return [];
  }

  const recipients = new Map<string, NotificationRecipient>();

  // Check if poll creator should be notified
  if (poll.userId && poll.userId !== excludeUserId) {
    const creator = await prisma.user.findUnique({
      where: { id: poll.userId },
      select: {
        id: true,
        email: true,
        locale: true,
        notificationPreferences: {
          select: { prefs: true },
        },
      },
    });

    if (creator) {
      const prefs = parsePrefs(creator.notificationPreferences?.prefs);
      const scope: NotificationScope = prefs[type];

      if (scope !== "off") {
        recipients.set(creator.id, {
          id: creator.id,
          email: creator.email,
          locale: creator.locale,
        });
      }
    }
  }

  // For "all" scope: find space members who opted into all poll notifications
  if (poll.spaceId) {
    const spaceMembers = await prisma.spaceMember.findMany({
      where: {
        spaceId: poll.spaceId,
        userId: { not: excludeUserId },
      },
      select: {
        user: {
          select: {
            id: true,
            email: true,
            locale: true,
            notificationPreferences: {
              select: { prefs: true },
            },
          },
        },
      },
    });

    for (const member of spaceMembers) {
      if (recipients.has(member.user.id)) {
        continue;
      }

      const prefs = parsePrefs(member.user.notificationPreferences?.prefs);
      const scope: NotificationScope = prefs[type];

      if (scope === "all") {
        recipients.set(member.user.id, {
          id: member.user.id,
          email: member.user.email,
          locale: member.user.locale,
        });
      }
    }
  }

  return Array.from(recipients.values());
}
