import { isSelfHosted } from "@/lib/constants";

/**
 * Webhooks ride on the API capability (cloud only) but stay behind their own
 * switch until the docs page that defines the payload contract is published.
 * Off by default, so production is dark until the switch is flipped.
 */
export const isWebhooksEnabled =
  !isSelfHosted && process.env.WEBHOOKS_ENABLED === "true";

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

export const DELIVERY_CLAIM_BATCH_SIZE = 100;

export const DELIVERY_CONCURRENCY = 10;

export const DELIVERY_TIMEOUT_MS = 10_000;

/** An in-flight delivery older than this was orphaned by a crashed run. */
export const IN_FLIGHT_TIMEOUT_MS = 2 * 60_000;

/** Exhausted deliveries in a row before the endpoint is disabled. */
export const MAX_CONSECUTIVE_FAILURES = 20;

/**
 * Webhook reference in the docs site: event payloads, headers and how to
 * verify a signature. Same home as the API reference.
 */
export const getWebhookDocsPath = () =>
  "https://support.rallly.co/api-reference/webhooks";

/**
 * The payload contract deliveries are built against, sent both in the body
 * and as `X-Rallly-Webhook-Version`. Date-based rather than `v1`: webhooks
 * are called at an address the receiver owns, so there is no URL to version
 * on the way `/api/v1` does, and a date sidesteps deciding what counts as a
 * major bump.
 *
 * There is deliberately no per-endpoint pinning: with one version it would
 * be a column, a branch and a UI row all carrying the same value. The
 * envelope is additive-only instead — new fields, new event types and new
 * enum members keep this version, and receivers are documented to ignore
 * what they don't recognise.
 *
 * A change that could break a receiver (a renamed or removed field, a
 * changed shape) requires pinning to land first, in the same change:
 *
 *   1. nullable `version` on SpaceWebhook, defaulted to this constant at
 *      creation and backfilled to the value below for existing rows — safe
 *      because every endpoint created before that migration was, by
 *      definition, built against it;
 *   2. `buildWebhookPayload` takes the endpoint's version and branches, so
 *      existing endpoints keep the shape they were written for while new
 *      ones default to the new version;
 *   3. an explicit upgrade action on an existing endpoint, keeping its URL
 *      and signing secret. Without one, moving version means deleting and
 *      recreating, which mints a new secret and forces a redeploy — so the
 *      oldest integrations would stay pinned forever and every old branch
 *      would have to be carried indefinitely;
 *   4. the settings list surfaces the version, which only earns its place
 *      once endpoints genuinely differ.
 *
 * Note that an upgrade is never instantaneous: payloads are frozen at
 * fan-out, so already-queued deliveries carry the old shape while new ones
 * carry the new. That is why the version travels in the body and not only
 * in the header — a receiver has to branch per payload, not per deploy.
 *
 * That migration stays available only as long as this rule holds. Shipping
 * a breaking change *without* pinning is the one thing that forecloses it:
 * existing endpoints would then have no recorded version and no way to
 * reconstruct which contract they were written against.
 */
export const WEBHOOK_VERSION = "2026-09-20";
