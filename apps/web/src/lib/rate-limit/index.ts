import "server-only";

import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/kv";
import { isRateLimitEnabled } from "./constants";

export type Unit = "ms" | "s" | "m" | "h" | "d";
export type Duration = `${number} ${Unit}` | `${number}${Unit}`;

export function createRatelimit(requests: number, duration: Duration) {
  if (!isRateLimitEnabled) {
    return null;
  }

  if (!redis) {
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, duration),
  });
}
