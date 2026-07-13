import { RedisStore } from "@hono-rate-limiter/redis";
import { rateLimiter } from "hono-rate-limiter";
import { redis } from "@/lib/kv";
import { apiError } from "./poll";

/**
 * Requests per minute allowed for a single space, uniform across all
 * endpoints. Adding more API keys to a space does not raise this limit.
 */
export const RATE_LIMIT_PER_MINUTE = 60;

type RateLimitEnv = {
  Variables: {
    apiAuth: {
      spaceId: string;
    };
  };
};

/**
 * A single per-space rate limit shared by every endpoint. Must run after
 * `spaceApiKeyAuth` so that `apiAuth.spaceId` is populated.
 *
 * Known limitation: when Redis/KV is unavailable the fallback is a per
 * instance memory store, which on Vercel is effectively no limit. Accepted
 * for now; request logging makes it observable.
 */
export const rateLimit = rateLimiter<RateLimitEnv>({
  windowMs: 60 * 1000,
  limit: RATE_LIMIT_PER_MINUTE,
  keyGenerator: (c) => `private-api:${c.get("apiAuth").spaceId}`,
  store: redis ? new RedisStore({ client: redis }) : undefined,
  handler: (c) => {
    return c.json(
      apiError(
        "RATE_LIMIT_EXCEEDED",
        "Rate limit exceeded. Retry after the time indicated in the Retry-After header.",
      ),
      429,
    );
  },
});
