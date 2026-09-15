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
 * monotonic, so the cursor is `createdAt`, which is the start of the
 * transaction that wrote the row, not its commit. The lag keeps the common
 * case from ever seeing an uncommitted row.
 */
export const FAN_OUT_LAG_MS = 10_000;

/**
 * Each run re-reads this much history behind the cursor. A transaction that
 * held its row open longer than the lag commits with a `createdAt` the
 * cursor already passed; the overlap picks it up on a later run and the
 * unique (webhook, activity) key drops the rows already fanned out. Far
 * longer than any transaction timeout we configure (30s).
 */
export const FAN_OUT_OVERLAP_MS = 5 * 60_000;

export const FAN_OUT_BATCH_SIZE = 500;

/** Pages one run drains per webhook before leaving the rest to the next. */
export const FAN_OUT_MAX_PAGES = 20;

export const DELIVERY_CLAIM_BATCH_SIZE = 100;

export const DELIVERY_CONCURRENCY = 10;

export const DELIVERY_TIMEOUT_MS = 10_000;

/** An in-flight delivery older than this was orphaned by a crashed run. */
export const IN_FLIGHT_TIMEOUT_MS = 2 * 60_000;

/** Exhausted deliveries in a row before the endpoint is disabled. */
export const MAX_CONSECUTIVE_FAILURES = 20;
