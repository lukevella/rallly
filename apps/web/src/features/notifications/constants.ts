import type { PollActivityType } from "@/features/activity/schema";
import type { ActivityEventType, NotificationPreferences } from "./schema";

export const defaultNotificationPreferences: NotificationPreferences = {
  "poll.response.submitted": true,
  "poll.comment.added": true,
  "inApp:poll.response.submitted": true,
  "inApp:poll.comment.added": true,
};

export const inboxNotificationLimit = 20;

/** The activity log entry each notifying event is recorded as. */
export const inboxActivityTypes = {
  "poll.response.submitted": "response_created",
  "poll.comment.added": "comment_added",
} as const satisfies Record<ActivityEventType, PollActivityType>;

/** Read entries are kept this long, then pruned by the house-keeping cron. */
export const INBOX_READ_RETENTION_DAYS = 90;

/** Unread entries are pruned too once they are this old. */
export const INBOX_UNREAD_RETENTION_DAYS = 365;
