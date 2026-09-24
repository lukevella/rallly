"use server";

import { refresh } from "next/cache";

import {
  unsubscribeWithToken,
  updateNotificationPreference,
} from "@/features/notifications/mutations";
import {
  unsubscribeWithTokenSchema,
  updateNotificationPreferenceSchema,
} from "@/features/notifications/schema";
import { track } from "@/lib/posthog";
import { actionClient, authActionClient } from "@/lib/safe-action/server";

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

    refresh();
  });

// Public: the signed token is the credential, verified in the mutation.
export const unsubscribeWithTokenAction = actionClient
  .metadata({ actionName: "unsubscribe_with_token" })
  .inputSchema(unsubscribeWithTokenSchema)
  .action(async ({ parsedInput }) => {
    const result = await unsubscribeWithToken({ token: parsedInput.token });

    refresh();

    return result;
  });
