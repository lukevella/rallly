import "server-only";

import { Prisma, prisma } from "@rallly/database";
import { env } from "@/env";

import {
  defaultNotificationPreferences,
  INBOX_READ_RETENTION_DAYS,
  INBOX_UNREAD_RETENTION_DAYS,
} from "./constants";
import { getNotificationRecipient } from "./data";
import type { ActivityEventType, NotificationChannel } from "./schema";
import { getNotificationPreferenceKey } from "./schema";
import { parseUnsubscribeToken } from "./utils";

export async function updateNotificationPreference({
  userId,
  eventType,
  channel,
  enabled,
}: {
  userId: string;
  eventType: ActivityEventType;
  channel: NotificationChannel;
  enabled: boolean;
}) {
  const key = getNotificationPreferenceKey(eventType, channel);
  const patch = JSON.stringify({ [key]: enabled });

  // The merge happens in the database (jsonb ||) so concurrent toggles of
  // different keys can't clobber each other the way a read-merge-replace
  // upsert would.
  const mergeIntoExistingRow = () => prisma.$executeRaw`
    UPDATE user_notification_preferences
    SET prefs = prefs || ${patch}::jsonb, updated_at = now()
    WHERE user_id = ${userId}
  `;

  if ((await mergeIntoExistingRow()) > 0) {
    return;
  }

  // No row yet — create through Prisma for the client-generated cuid. A
  // concurrent create surfaces as P2002 and falls back to the atomic merge.
  try {
    await prisma.userNotificationPreferences.create({
      data: {
        userId,
        prefs: { ...defaultNotificationPreferences, [key]: enabled },
      },
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      await mergeIntoExistingRow();
      return;
    }
    throw e;
  }
}

/**
 * Mutes whatever a signed unsubscribe token points at. The token is the
 * credential (there is no session on either caller: the one-click POST from a
 * mail client or the confirmation page), so it is verified here rather than
 * in an action gate.
 */
export async function unsubscribeWithToken({ token }: { token: string }) {
  const target = parseUnsubscribeToken({
    token,
    secret: env.SECRET_PASSWORD,
  });

  if (!target) {
    return { ok: false as const, reason: "invalidToken" as const };
  }

  switch (target.kind) {
    case "poll": {
      // The same row write as the poll feature's setPollMuted, kept here so
      // notifications never imports poll: poll depends on this feature for
      // recipients and tokens, and features must not import each other in
      // both directions.
      const { count } = await prisma.poll.updateMany({
        where: {
          id: target.pollId,
          userId: target.userId,
          deletedAt: null,
        },
        data: { muted: true },
      });
      if (count === 0) {
        return { ok: false as const, reason: "notFound" as const };
      }
      return { ok: true as const, target };
    }
  }
}

/**
 * Puts a poll event in its organizer's inbox, unless the same recipient rules
 * the email follows (muting, preferences, membership) say they should not
 * hear about it. Returns the skip reason so the caller can trace it.
 */
export async function createInboxNotification({
  activityId,
  pollId,
  type,
  excludeUserId,
}: {
  /** The activity log entry the event was recorded as. */
  activityId: string;
  pollId: string;
  type: ActivityEventType;
  excludeUserId: string;
}) {
  const result = await getNotificationRecipient({
    pollId,
    type,
    channel: "inApp",
    excludeUserId,
  });

  if (!result.ok) {
    return result;
  }

  await prisma.inboxNotification.create({
    data: { userId: result.recipient.id, activityId },
  });

  return { ok: true as const };
}

/** Marks one entry, or every entry when no id is given, as read. */
export async function markInboxNotificationsRead({
  userId,
  notificationId,
}: {
  userId: string;
  notificationId?: string;
}) {
  await prisma.inboxNotification.updateMany({
    where: {
      userId,
      readAt: null,
      ...(notificationId !== undefined && { id: notificationId }),
    },
    data: { readAt: new Date() },
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Deletes entries past retention. Returns how many were removed. */
export async function pruneInboxNotifications() {
  const now = Date.now();
  const { count } = await prisma.inboxNotification.deleteMany({
    where: {
      OR: [
        { readAt: { lt: new Date(now - INBOX_READ_RETENTION_DAYS * DAY_MS) } },
        {
          createdAt: {
            lt: new Date(now - INBOX_UNREAD_RETENTION_DAYS * DAY_MS),
          },
        },
      ],
    },
  });
  return count;
}
