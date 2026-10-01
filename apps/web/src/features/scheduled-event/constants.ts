export const isScheduledEventEnabled =
  process.env.NODE_ENV === "development" ||
  process.env.SCHEDULED_EVENTS_ENABLED === "true";

export const scheduledEventTag = (id: string) => `scheduled-event:${id}`;

/**
 * Invite emails claimed per run. A run triggered by a booking sends one
 * batch for that event at once; the minute cron drains the rest, so a large
 * poll goes out at this rate rather than in one request.
 */
export const INVITE_EMAIL_BATCH_SIZE = 100;

export const INVITE_EMAIL_CONCURRENCY = 5;

/**
 * A claim older than this is abandoned: the run died, or the send failed
 * and the invite waits out this long before its next attempt.
 */
export const INVITE_EMAIL_CLAIM_TIMEOUT_MS = 10 * 60_000;

export const MAX_INVITE_EMAIL_ATTEMPTS = 3;
