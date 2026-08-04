import "server-only";

import { cache } from "react";
import { getNotificationPreferences } from "@/features/notifications/data";
import { requireUser } from "@/features/user/loaders";

export const loadNotificationPreferences = cache(async () => {
  const user = await requireUser();
  return getNotificationPreferences(user.id);
});
