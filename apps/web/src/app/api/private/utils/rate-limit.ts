import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import {
  API_RATE_LIMIT_PER_DAY,
  API_RATE_LIMIT_PER_MINUTE,
} from "@/features/api-keys/constants";
import { redis } from "@/lib/kv";
import { apiError } from "./poll";

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

const incrementScript = redis
  ? redis.createScript<[number, number, number, number]>(INCREMENT_SCRIPT)
  : null;

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

function serviceUnavailable(c: Context, failure: RateLimitFailure) {
  c.set("rateLimitFailure", failure);
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
 * Fails closed: the API is cloud only and cloud always has KV, so a missing
 * client is a misconfiguration and an unreachable store is an outage. Both
 * answer 503 rather than letting traffic through unmetered, and both are
 * surfaced on the wide event via `rateLimitFailure`.
 */
export const rateLimit = createMiddleware<RateLimitEnv>(async (c, next) => {
  if (!incrementScript) {
    return serviceUnavailable(c, {
      reason: "store_unavailable",
      message: "Rate limit store is not configured",
    });
  }

  const spaceId = c.get("apiAuth").spaceId;
  const keys = [
    `hrl:private-api:${spaceId}`,
    `hrl:private-api:daily:${spaceId}`,
  ];

  let result: [number, number, number, number];
  try {
    result = await incrementScript.exec(keys, [
      MINUTE_WINDOW_MS.toString(),
      DAY_WINDOW_MS.toString(),
    ]);
  } catch (error) {
    return serviceUnavailable(c, {
      reason: "store_error",
      message: error instanceof Error ? error.message : String(error),
    });
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
