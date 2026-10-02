import "server-only";

import { prisma } from "@rallly/database";
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";

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
  excludeUserId,
}: {
  pollId: string;
  type: ActivityEventType;
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

  const prefs = parsePrefs(creator.notificationPreferences?.prefs);

  if (!prefs[type]) {
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
