import "server-only";

import { prisma } from "@rallly/database";

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
  const existing = await prisma.userNotificationPreferences.findUnique({
    where: { userId },
    select: { prefs: true },
  });

  const updatedPrefs = {
    ...defaultNotificationPreferences,
    ...(existing?.prefs as object),
    [eventType]: enabled,
  };

  await prisma.userNotificationPreferences.upsert({
    where: { userId },
    create: {
      userId,
      prefs: updatedPrefs,
    },
    update: {
      prefs: updatedPrefs,
    },
  });
}
