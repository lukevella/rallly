import "server-only";

import { Prisma, prisma } from "@rallly/database";

import { defaultNotificationPreferences } from "./constants";
import type { ActivityEventType } from "./schema";

export async function updateNotificationPreference({
  userId,
  eventType,
  enabled,
}: {
  userId: string;
  eventType: ActivityEventType;
  enabled: boolean;
}) {
  const patch = JSON.stringify({ [eventType]: enabled });

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
        prefs: { ...defaultNotificationPreferences, [eventType]: enabled },
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
