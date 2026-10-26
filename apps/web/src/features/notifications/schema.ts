import * as z from "zod";

/**
 * Activity event type naming convention: {entity}.{sub-entity}.{past-tense-verb}
 */
export const activityEventTypes = [
  "poll.response.submitted",
  "poll.comment.added",
] as const;

export type ActivityEventType = (typeof activityEventTypes)[number];

export const notificationChannels = ["email", "inApp"] as const;

export type NotificationChannel = (typeof notificationChannels)[number];

// Email keys were stored before channels existed, so they stay unprefixed.
export const notificationPreferenceKeys = [
  ...activityEventTypes,
  ...activityEventTypes.map((type) => `inApp:${type}` as const),
] as const;

export type NotificationPreferenceKey =
  (typeof notificationPreferenceKeys)[number];

export function getNotificationPreferenceKey(
  eventType: ActivityEventType,
  channel: NotificationChannel,
): NotificationPreferenceKey {
  return channel === "email" ? eventType : `inApp:${eventType}`;
}

// Partial: rows written before a key existed fall back to its default.
export const notificationPreferencesSchema = z.partialRecord(
  z.enum(notificationPreferenceKeys),
  z.boolean(),
);

export const updateNotificationPreferenceSchema = z.object({
  eventType: z.enum(activityEventTypes),
  channel: z.enum(notificationChannels),
  enabled: z.boolean(),
});

export type NotificationPreferences = Record<
  NotificationPreferenceKey,
  boolean
>;

export const unsubscribeWithTokenSchema = z.object({
  token: z.string().min(1),
});

export const markInboxNotificationReadSchema = z.object({
  notificationId: z.string(),
});
