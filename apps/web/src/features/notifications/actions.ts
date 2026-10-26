"use server";

import { refresh } from "next/cache";

import {
  markInboxNotificationsRead,
  unsubscribeWithToken,
  updateNotificationPreference,
} from "@/features/notifications/mutations";
import {
  markInboxNotificationReadSchema,
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
      channel: parsedInput.channel,
      enabled: parsedInput.enabled,
    });

    track(ctx.user, {
      event: "notification_preference_update",
      properties: {
        eventType: parsedInput.eventType,
        channel: parsedInput.channel,
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

    if (result.ok) {
      track(
        { id: result.target.userId, isGuest: false },
        {
          event: "poll_notification:mute_update",
          properties: {
            poll_id: result.target.pollId,
            muted: true,
            source: "unsubscribe_page",
          },
          groups: { poll: result.target.pollId },
        },
      );
    }

    refresh();

    return result;
  });

export const markInboxNotificationReadAction = authActionClient
  .metadata({ actionName: "mark_inbox_notification_read" })
  .inputSchema(markInboxNotificationReadSchema)
  .action(async ({ ctx, parsedInput }) => {
    await markInboxNotificationsRead({
      userId: ctx.user.id,
      notificationId: parsedInput.notificationId,
    });
  });

export const markAllInboxNotificationsReadAction = authActionClient
  .metadata({ actionName: "mark_all_inbox_notifications_read" })
  .action(async ({ ctx }) => {
    await markInboxNotificationsRead({ userId: ctx.user.id });

    track(ctx.user, { event: "inbox:notifications_mark_read" });
  });
