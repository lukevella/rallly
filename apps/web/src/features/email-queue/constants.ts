export const QUEUED_EMAIL_KINDS = ["scheduled_event_invite"] as const;

/**
 * Emails claimed per run. An action that queues emails sends one batch of
 * its own at once; the minute cron drains the rest, so a large fan-out goes
 * out at this rate rather than in one request.
 */
export const QUEUED_EMAIL_BATCH_SIZE = 100;

export const QUEUED_EMAIL_CONCURRENCY = 5;

/**
 * A claim older than this is abandoned: the run died, or the send failed
 * and the email waits out this long before its next attempt.
 */
export const QUEUED_EMAIL_CLAIM_TIMEOUT_MS = 10 * 60_000;

export const MAX_QUEUED_EMAIL_ATTEMPTS = 3;
