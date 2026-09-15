/**
 * Retry schedule indexed by the number of attempts already made: after the
 * first failure wait 1 minute, after the second 5 minutes, and so on. A
 * failure past the end of the schedule exhausts the delivery.
 */
export const RETRY_DELAYS_MS = [
  60_000,
  5 * 60_000,
  30 * 60_000,
  2 * 60 * 60_000,
  12 * 60 * 60_000,
] as const;

export const MAX_DELIVERY_ATTEMPTS = RETRY_DELAYS_MS.length + 1;

/**
 * Fan-out reads activities up to now minus this lag. cuid ids are not
 * monotonic, so the cursor is `createdAt`, and a row inserted inside a
 * transaction that commits after the cursor passed its timestamp would
 * otherwise be skipped forever. Ten seconds covers any transaction we run.
 */
export const FAN_OUT_LAG_MS = 10_000;

export const FAN_OUT_BATCH_SIZE = 500;

export const DELIVERY_CLAIM_BATCH_SIZE = 100;

export const DELIVERY_CONCURRENCY = 10;

export const DELIVERY_TIMEOUT_MS = 10_000;

/** An in-flight delivery older than this was orphaned by a crashed run. */
export const IN_FLIGHT_TIMEOUT_MS = 2 * 60_000;

/** Exhausted deliveries in a row before the endpoint is disabled. */
export const MAX_CONSECUTIVE_FAILURES = 20;
