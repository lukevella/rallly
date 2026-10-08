export const QUEUED_EMAIL_KINDS = [
  "scheduled_event_invite",
  "review_request",
] as const;

/**
 * Emails an action sends from its own request, right after the response.
 * Scheduled polls have had at most 32 participants, with the 99th
 * percentile between 13 and 30, so this covers almost every booking; the
 * rest waits for the scheduler.
 */
export const QUEUED_EMAIL_IMMEDIATE_BATCH_SIZE = 25;

/**
 * Emails a scheduled run claims. The shared send rate, not this, sets the
 * pace: at that rate a full batch takes about half a minute, inside the minute
 * between runs and well inside the claim timeout.
 */
export const QUEUED_EMAIL_BATCH_SIZE = 500;

/**
 * Queued email shares the SES account's send rate (50 per second) with
 * every email sent directly, login codes included. Capping the queue well
 * below it keeps a large fan-out from getting those throttled.
 */
export const QUEUED_EMAIL_SENDS_PER_SECOND = 20;

/**
 * How long one send waits for a slot under the shared rate before the
 * attempt counts as failed and is retried later.
 */
export const QUEUED_EMAIL_RATE_WAIT_MS = 30_000;

export const QUEUED_EMAIL_CONCURRENCY = 5;

/**
 * A claim older than this is abandoned: the run died, or the send failed
 * and the email waits out this long before its next attempt.
 */
export const QUEUED_EMAIL_CLAIM_TIMEOUT_MS = 10 * 60_000;

export const MAX_QUEUED_EMAIL_ATTEMPTS = 3;

/**
 * Emails that reached a final state are deleted after this long. Long
 * enough to answer "did my participants get the email" and to look into
 * abuse, and to cover any per-account email budget window, which must not
 * be longer than this.
 */
export const QUEUED_EMAIL_RETENTION_MS = 30 * 24 * 60 * 60_000;

/** Rows deleted per statement, and statements per run, when purging. */
export const QUEUED_EMAIL_PURGE_CHUNK_SIZE = 1000;
export const QUEUED_EMAIL_PURGE_MAX_CHUNKS = 20;

/**
 * A run stops starting sends after this long and hands the rest of its
 * claims back. Together with the rate wait it bounds how late a run can
 * send, which keeps every send inside its claim: an email reclaimed by
 * another run while this one still sends it would go out twice.
 */
export const QUEUED_EMAIL_RUN_BUDGET_MS = 2 * 60_000;
