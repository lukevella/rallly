"use server";

import { updateNotificationPreference } from "@/features/notifications/mutations";
import { updateNotificationPreferenceSchema } from "@/features/notifications/schema";
import { track } from "@/lib/posthog";
import { authActionClient } from "@/lib/safe-action/server";

export const updateNotificationPreferenceAction = authActionClient
  .metadata({ actionName: "update_notification_preference" })
  .inputSchema(updateNotificationPreferenceSchema)
  .action(async ({ ctx, parsedInput }) => {
    await updateNotificationPreference({
      userId: ctx.user.id,
      eventType: parsedInput.eventType,
      enabled: parsedInput.enabled,
    });

    track(ctx.user, {
      event: "notification_preference_update",
      properties: {
        eventType: parsedInput.eventType,
        enabled: parsedInput.enabled,
      },
    });
  });
