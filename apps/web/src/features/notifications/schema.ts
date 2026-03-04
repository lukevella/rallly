import * as z from "zod";

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
  z.boolean(),
);

export type NotificationPreferences = Record<ActivityEventType, boolean>;
