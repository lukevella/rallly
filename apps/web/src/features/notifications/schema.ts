import * as z from "zod";

export const notificationScopeSchema = z.enum(["off", "mine", "all"]);

export type NotificationScope = z.infer<typeof notificationScopeSchema>;

/**
 * Activity event type naming convention: {entity}.{sub-entity}.{past-tense-verb}
 */
export const activityEventTypes = [
  "poll.response.submitted",
  "poll.comment.added",
] as const;

export type ActivityEventType = (typeof activityEventTypes)[number];

export const notificationPreferencesSchema = z.record(
  z.enum(activityEventTypes),
  notificationScopeSchema,
);

export type NotificationPreferences = Record<
  ActivityEventType,
  NotificationScope
>;
