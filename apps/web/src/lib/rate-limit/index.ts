import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/kv";
import { isRateLimitEnabled } from "./constants";

export type Unit = "ms" | "s" | "m" | "h" | "d";
export type Duration = `${number} ${Unit}` | `${number}${Unit}`;

const unitToMs: Record<Unit, number> = {
  ms: 1,
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

function parseDurationMs(duration: Duration): number {
  const match = duration.match(/^(\d+)\s?(ms|s|m|h|d)$/);
  if (!match) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  return Number(match[1]) * unitToMs[match[2] as Unit];
}

/**
 * Simple fixed-window in-memory rate limiter.
 * Entries are evicted after their window expires to prevent unbounded growth.
 */
function createMemoryLimiter(maxRequests: number, duration: Duration) {
  const windowMs = parseDurationMs(duration);
  const windows = new Map<string, { count: number; resetAt: number }>();

  return {
    async limit(key: string) {
      const now = Date.now();
      const entry = windows.get(key);

      if (!entry || now >= entry.resetAt) {
        windows.set(key, { count: 1, resetAt: now + windowMs });
        // Schedule cleanup so the entry doesn't live forever
        setTimeout(() => windows.delete(key), windowMs).unref?.();
        return { success: true, remainingPoints: maxRequests - 1 };
      }

      entry.count++;

      if (entry.count > maxRequests) {
        return { success: false, remainingPoints: 0 };
      }

      return { success: true, remainingPoints: maxRequests - entry.count };
    },
    name: "memory" as const,
  };
}

export function createRatelimit(requests: number, duration: Duration) {
  if (!isRateLimitEnabled) {
    return null;
  }

  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(requests, duration),
    });

    return {
      async limit(key: string) {
        const res = await limiter.limit(key);
        return {
          success: res.success,
          remainingPoints: res.remaining,
        };
      },
      name: "redis" as const,
    };
  }

  return createMemoryLimiter(requests, duration);
}

/**
 * A rate shared by every process, for work that should wait its turn rather
 * than be refused. `acquire` resolves true once a slot is free, false if
 * none freed up within the timeout. Needs Redis: a per-process counter
 * shares nothing across serverless instances, so without Redis (or with
 * rate limiting off) there is no limiter and callers go unthrottled.
 */
export function createSharedRate(requests: number, duration: Duration) {
  if (!isRateLimitEnabled || !redis) {
    return null;
  }

  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, duration),
  });

  return {
    async acquire(key: string, timeoutMs: number) {
      const res = await limiter.blockUntilReady(key, timeoutMs);
      return res.success;
    },
  };
}

// Adds the points and starts the window on the first reservation, in one
// step, so concurrent reservations cannot both read the same balance.
const RESERVE_SCRIPT = `
local used = redis.call("INCRBY", KEYS[1], ARGV[1])
if used == tonumber(ARGV[1]) then
  redis.call("PEXPIRE", KEYS[1], ARGV[2])
end
return used
`;

/**
 * A fixed-window allowance of points per key. `reserve` atomically takes up
 * to `points` and resolves how many it got, so a caller can do part of a
 * batch when the allowance runs out midway. Returns null with rate limiting
 * off, meaning no allowance applies.
 */
export function createBudget(points: number, duration: Duration) {
  if (!isRateLimitEnabled) {
    return null;
  }

  const windowMs = parseDurationMs(duration);
  const granted = (requested: number, usedAfter: number) =>
    Math.max(0, Math.min(requested, points - (usedAfter - requested)));

  if (redis) {
    const client = redis;
    return {
      async reserve(key: string, requested: number) {
        const usedAfter = await client.eval<[number, number], number>(
          RESERVE_SCRIPT,
          [key],
          [requested, windowMs],
        );
        return granted(requested, usedAfter);
      },
    };
  }

  const windows = new Map<string, { used: number; resetAt: number }>();
  return {
    async reserve(key: string, requested: number) {
      const now = Date.now();
      let entry = windows.get(key);
      if (!entry || now >= entry.resetAt) {
        const fresh = { used: 0, resetAt: now + windowMs };
        entry = fresh;
        windows.set(key, fresh);
        // A late timer must not evict the window that replaced its own.
        setTimeout(() => {
          if (windows.get(key) === fresh) windows.delete(key);
        }, windowMs).unref?.();
      }
      entry.used += requested;
      return granted(requested, entry.used);
    },
  };
}
