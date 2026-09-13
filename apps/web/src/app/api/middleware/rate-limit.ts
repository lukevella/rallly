import * as Sentry from "@sentry/nextjs";
import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import {
  API_RATE_LIMIT_PER_DAY,
  API_RATE_LIMIT_PER_MINUTE,
} from "@/features/api-keys/constants";
import { isFeatureEnabled } from "@/lib/feature-flags/server";
import { redis } from "@/lib/kv";
import { apiError } from "./api-error";

/**
 * Re-exported for the OpenAPI docs and tests. The values live in the
 * api-keys feature so the settings UI can read them without pulling in this
 * server-only module.
 */
export const RATE_LIMIT_PER_MINUTE = API_RATE_LIMIT_PER_MINUTE;
export const RATE_LIMIT_PER_DAY = API_RATE_LIMIT_PER_DAY;

const MINUTE_WINDOW_MS = 60 * 1000;
const DAY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type RateLimitWindow = {
  limit: number;
  used: number;
  remaining: number;
  resetTime: Date;
};

export type RateLimitInfo = {
  minute: RateLimitWindow;
  day: RateLimitWindow;
};

export type RateLimitFailure = {
  reason: "store_unavailable" | "store_error";
  message: string;
};

/**
 * The fail-closed 503 is returned, not thrown, so nothing upstream reports it.
 * A fixed message per reason keeps Sentry grouping to one issue per cause;
 * the store's own message travels as `cause` and on the wide event.
 */
export class RateLimitStoreError extends Error {
  readonly reason: RateLimitFailure["reason"];

  constructor(reason: RateLimitFailure["reason"], options?: ErrorOptions) {
    super(
      reason === "store_unavailable"
        ? "Rate limit store is not configured"
        : "Rate limit store request failed",
      options,
    );
    this.name = "RateLimitStoreError";
    this.reason = reason;
  }
}

type RateLimitEnv = {
  Variables: {
    apiAuth: {
      spaceId: string;
    };
    rateLimit?: RateLimitInfo;
    rateLimitFailure?: RateLimitFailure;
  };
};

/**
 * Increments both fixed windows atomically and returns their counters and
 * remaining TTLs. The expiry is set when a key is created, or re-armed if it
 * somehow lost its TTL, so a counter can never outlive its window.
 */
const INCREMENT_SCRIPT = `
local function bump(key, windowMs)
  local hits = redis.call("INCR", key)
  local ttl = redis.call("PTTL", key)
  if hits == 1 or ttl <= 0 then
    redis.call("PEXPIRE", key, windowMs)
    ttl = windowMs
  end
  return hits, ttl
end
local minuteHits, minuteTtl = bump(KEYS[1], tonumber(ARGV[1]))
local dayHits, dayTtl = bump(KEYS[2], tonumber(ARGV[2]))
return { minuteHits, minuteTtl, dayHits, dayTtl }
`;

type Counters = [
  minuteHits: number,
  minuteTtlMs: number,
  dayHits: number,
  dayTtlMs: number,
];

type RateLimitStore = {
  increment: (spaceId: string) => Promise<Counters>;
};

function createRedisStore(client: NonNullable<typeof redis>): RateLimitStore {
  const script = client.createScript<Counters>(INCREMENT_SCRIPT);
  return {
    increment: (spaceId) =>
      script.exec(
        [`hrl:private-api:${spaceId}`, `hrl:private-api:daily:${spaceId}`],
        [MINUTE_WINDOW_MS.toString(), DAY_WINDOW_MS.toString()],
      ),
  };
}

/**
 * Same semantics as the Lua script, held in process. Exact only when one
 * process serves every request, which is what the `inProcessRateLimit`
 * capability asserts. Expired counters are swept lazily, at most once a
 * minute on the request path, so revoked or dormant spaces do not pin
 * entries until restart. Active counters are never evicted early.
 */
export function createMemoryStore(): RateLimitStore {
  const counters = new Map<string, { hits: number; expiresAt: number }>();
  let lastSweepAt = 0;

  const sweep = (now: number) => {
    if (now - lastSweepAt < MINUTE_WINDOW_MS) {
      return;
    }
    lastSweepAt = now;
    for (const [key, entry] of counters) {
      if (entry.expiresAt <= now) {
        counters.delete(key);
      }
    }
  };

  const bump = (key: string, windowMs: number): [number, number] => {
    const now = Date.now();
    sweep(now);
    const current = counters.get(key);
    if (!current || current.expiresAt <= now) {
      counters.set(key, { hits: 1, expiresAt: now + windowMs });
      return [1, windowMs];
    }
    current.hits += 1;
    return [current.hits, current.expiresAt - now];
  };

  return {
    increment: async (spaceId) => [
      ...bump(`minute:${spaceId}`, MINUTE_WINDOW_MS),
      ...bump(`day:${spaceId}`, DAY_WINDOW_MS),
    ],
  };
}

function selectStore(): RateLimitStore | null {
  if (redis) {
    return createRedisStore(redis);
  }
  if (isFeatureEnabled("inProcessRateLimit")) {
    return createMemoryStore();
  }
  return null;
}

const store = selectStore();

function toWindow(limit: number, hits: number, ttlMs: number): RateLimitWindow {
  return {
    limit,
    used: hits,
    remaining: Math.max(limit - hits, 0),
    resetTime: new Date(Date.now() + ttlMs),
  };
}

function resetSeconds(window: RateLimitWindow) {
  return Math.max(
    0,
    Math.ceil((window.resetTime.getTime() - Date.now()) / 1000),
  );
}

/**
 * The window closest to exhaustion, by fraction of quota left, is the one
 * the `RateLimit-*` headers report so a client backing off on them slows
 * down for whichever limit will bite first.
 */
export function pickBindingWindow(info: RateLimitInfo) {
  const minuteFraction = info.minute.remaining / info.minute.limit;
  const dayFraction = info.day.remaining / info.day.limit;
  return minuteFraction <= dayFraction ? info.minute : info.day;
}

function setRateLimitHeaders(c: Context, info: RateLimitInfo) {
  const binding = pickBindingWindow(info);
  c.header(
    "RateLimit-Policy",
    `${info.minute.limit};w=${MINUTE_WINDOW_MS / 1000}, ${info.day.limit};w=${DAY_WINDOW_MS / 1000}`,
  );
  c.header("RateLimit-Limit", binding.limit.toString());
  c.header("RateLimit-Remaining", binding.remaining.toString());
  c.header("RateLimit-Reset", resetSeconds(binding).toString());
}

const STORE_ERROR_REPORT_INTERVAL_MS = 60 * 1000;
const lastStoreErrorReportAt = new Map<RateLimitFailure["reason"], number>();

/**
 * During an outage every API request takes this path, so report at most one
 * event per reason per minute per process. The alert only needs the first;
 * the wide event keeps the per-request detail.
 */
function reportStoreError(
  failure: RateLimitFailure,
  { spaceId, cause }: { spaceId: string; cause?: unknown },
) {
  const now = Date.now();
  const lastReportAt = lastStoreErrorReportAt.get(failure.reason);
  if (lastReportAt && now - lastReportAt < STORE_ERROR_REPORT_INTERVAL_MS) {
    return;
  }
  lastStoreErrorReportAt.set(failure.reason, now);
  Sentry.captureException(new RateLimitStoreError(failure.reason, { cause }), {
    tags: { rateLimiterError: failure.reason },
    fingerprint: ["rate-limit-store", failure.reason],
    extra: { spaceId },
  });
}

function serviceUnavailable(
  c: Context,
  failure: RateLimitFailure,
  { spaceId, cause }: { spaceId: string; cause?: unknown },
) {
  c.set("rateLimitFailure", failure);
  reportStoreError(failure, { spaceId, cause });
  return c.json(
    apiError(
      "SERVICE_UNAVAILABLE",
      "The API is temporarily unavailable. Retry after the time indicated in the Retry-After header.",
    ),
    503,
    { "Retry-After": "60" },
  );
}

/**
 * Per-space rate limits shared by every endpoint: a per-minute window that
 * bounds burst rate and a daily window that bounds volume. Both count every
 * request, including rejected ones, and both key on the space so extra API
 * keys do not raise them. Must run after `spaceApiKeyAuth` so that
 * `apiAuth.spaceId` is populated.
 *
 * Fails closed: without KV, and without the `inProcessRateLimit` capability
 * that makes a per-process counter exact, a missing store is a
 * misconfiguration and an unreachable store is an outage. Both answer 503
 * rather than letting traffic through unmetered, and both are surfaced on
 * the wide event via `rateLimitFailure`.
 */
export const rateLimit = createMiddleware<RateLimitEnv>(async (c, next) => {
  const { spaceId } = c.get("apiAuth");
  if (!store) {
    return serviceUnavailable(
      c,
      {
        reason: "store_unavailable",
        message: "Rate limit store is not configured",
      },
      { spaceId },
    );
  }

  let result: Counters;
  try {
    result = await store.increment(spaceId);
  } catch (error) {
    return serviceUnavailable(
      c,
      {
        reason: "store_error",
        message: error instanceof Error ? error.message : String(error),
      },
      { spaceId, cause: error },
    );
  }

  const [minuteHits, minuteTtl, dayHits, dayTtl] = result;
  const info: RateLimitInfo = {
    minute: toWindow(RATE_LIMIT_PER_MINUTE, minuteHits, minuteTtl),
    day: toWindow(RATE_LIMIT_PER_DAY, dayHits, dayTtl),
  };

  c.set("rateLimit", info);
  setRateLimitHeaders(c, info);

  const exceeded = [info.minute, info.day].filter(
    (window) => window.used > window.limit,
  );

  if (exceeded.length > 0) {
    const retryAfter = Math.max(...exceeded.map(resetSeconds));
    c.header("Retry-After", retryAfter.toString());
    return c.json(
      apiError(
        "RATE_LIMIT_EXCEEDED",
        "Rate limit exceeded. Retry after the time indicated in the Retry-After header.",
      ),
      429,
    );
  }

  await next();
});
