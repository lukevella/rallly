import "server-only";

import { cache } from "react";
import { env } from "@/env";
import {
  getNotificationPreferences,
  getPollMuteTarget,
} from "@/features/notifications/data";
import { parseUnsubscribeToken } from "@/features/notifications/utils";
import { requireUser } from "@/features/user/loaders";

export const loadNotificationPreferences = cache(async () => {
  const user = await requireUser();
  return getNotificationPreferences(user.id);
});

/**
 * Resolves the actor from the unsubscribe token instead of the session: the
 * page is reached from an email and must work without login.
 */
export const loadUnsubscribeTarget = cache(async (token: string) => {
  const target = parseUnsubscribeToken({
    token,
    secret: env.SECRET_PASSWORD,
  });

  if (!target) {
    return null;
  }

  switch (target.kind) {
    case "poll": {
      const poll = await getPollMuteTarget(target);
      return poll ? { kind: "poll" as const, poll } : null;
    }
  }
});
