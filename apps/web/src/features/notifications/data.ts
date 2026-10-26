import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";

import type {
  ActivityEventType,
  NotificationChannel,
  NotificationPreferences,
} from "./schema";
import { getNotificationPreferenceKey } from "./schema";
import {
  getInboxActivityTypes,
  parseNotificationPreferences,
  toInboxEvent,
} from "./utils";

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const row = await prisma.userNotificationPreferences.findUnique({
    where: { userId },
    select: { prefs: true },
  });

  return parseNotificationPreferences(row?.prefs);
}

type NotificationRecipient = {
  id: string;
  email: string;
  locale: string | null;
};

export type NotificationSkipReason =
  | "no_creator"
  | "poll_deleted"
  | "triggered_by_creator"
  | "poll_muted"
  | "creator_is_guest"
  | "not_effective_member"
  | "preference_off";

/**
 * Get the poll creator if they should receive a notification for this event.
 * Otherwise returns why not, so a skipped notification can be traced after
 * the fact.
 */
export async function getNotificationRecipient({
  pollId,
  type,
  channel,
  excludeUserId,
}: {
  pollId: string;
  type: ActivityEventType;
  channel: NotificationChannel;
  excludeUserId: string;
}): Promise<
  | { ok: true; recipient: NotificationRecipient }
  | { ok: false; reason: NotificationSkipReason }
> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { userId: true, spaceId: true, muted: true, deleted: true },
  });

  if (!poll?.userId) {
    return { ok: false, reason: "no_creator" };
  }

  if (poll.deleted) {
    return { ok: false, reason: "poll_deleted" };
  }

  if (poll.userId === excludeUserId) {
    return { ok: false, reason: "triggered_by_creator" };
  }

  if (poll.muted) {
    return { ok: false, reason: "poll_muted" };
  }

  const creator = await prisma.user.findUnique({
    where: { id: poll.userId },
    select: {
      id: true,
      email: true,
      locale: true,
      isAnonymous: true,
      // A poll in a space notifies its creator only while they remain an
      // effective member of it. Once they have left, the poll is the
      // space's and its responses are none of their business.
      memberOf: poll.spaceId
        ? {
            where: {
              spaceId: poll.spaceId,
              ...effectiveSpaceMemberWhere({ userId: poll.userId }),
            },
            select: { id: true },
            take: 1,
          }
        : false,
      notificationPreferences: {
        select: { prefs: true },
      },
    },
  });

  if (!creator) {
    return { ok: false, reason: "no_creator" };
  }

  if (creator.isAnonymous) {
    return { ok: false, reason: "creator_is_guest" };
  }

  if (poll.spaceId && creator.memberOf.length === 0) {
    return { ok: false, reason: "not_effective_member" };
  }

  const prefs = parseNotificationPreferences(
    creator.notificationPreferences?.prefs,
  );

  if (!prefs[getNotificationPreferenceKey(type, channel)]) {
    return { ok: false, reason: "preference_off" };
  }

  return {
    ok: true,
    recipient: {
      id: creator.id,
      email: creator.email,
      locale: creator.locale,
    },
  };
}

/**
 * The poll an unsubscribe token points at, scoped to the owner the token was
 * issued for so a token can't reveal anything about a poll that changed hands.
 */
export async function getPollMuteTarget({
  pollId,
  userId,
}: {
  pollId: string;
  userId: string;
}) {
  return prisma.poll.findFirst({
    where: { id: pollId, userId, deleted: false },
    select: { id: true, title: true, muted: true },
  });
}

/**
 * A page of the user's inbox, newest first, with the unread total. Muting a
 * poll or turning an in-app preference off hides its entries, past ones
 * included. Only polls the user still organizes are shown: an entry about a
 * poll that was deleted, changed hands or sits in a space they can no longer
 * access is no longer theirs to act on.
 */
export async function listInboxNotifications({
  userId,
  limit,
  cursor,
}: {
  userId: string;
  limit: number;
  /** The last id of the previous page. */
  cursor?: string;
}) {
  const prefs = await getNotificationPreferences(userId);

  const where = {
    userId,
    activity: {
      type: { in: getInboxActivityTypes(prefs) },
      poll: {
        userId,
        deleted: false,
        muted: false,
        // The same membership rule the entry was created under: losing
        // access to the space (e.g. a downgrade) hides its polls again.
        OR: [
          { spaceId: null },
          {
            space: { members: { some: effectiveSpaceMemberWhere({ userId }) } },
          },
        ],
      },
    },
  } satisfies Prisma.InboxNotificationWhereInput;

  const [rows, unreadCount] = await Promise.all([
    prisma.inboxNotification.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
      select: {
        id: true,
        readAt: true,
        createdAt: true,
        activity: {
          select: {
            type: true,
            userId: true,
            participantId: true,
            inviteId: true,
            optionId: true,
            payload: true,
            poll: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.inboxNotification.count({ where: { ...where, readAt: null } }),
  ]);

  const page = rows.slice(0, limit);

  return {
    unreadCount,
    nextCursor: rows.length > limit ? page[page.length - 1]?.id : undefined,
    notifications: page.flatMap(({ activity, ...row }) => {
      const event = toInboxEvent(activity);
      return event ? [{ ...row, ...event, poll: activity.poll }] : [];
    }),
  };
}
