import { RedisStore } from "@hono-rate-limiter/redis";
import { rateLimiter } from "hono-rate-limiter";
import { API_RATE_LIMIT_PER_MINUTE } from "@/features/api-keys/constants";
import { redis } from "@/lib/kv";
import { apiError } from "./poll";

/**
 * Re-exported for the OpenAPI docs and tests. The value lives in the
 * api-keys feature so the settings UI can read it without pulling in this
 * server-only module.
 */
export const RATE_LIMIT_PER_MINUTE = API_RATE_LIMIT_PER_MINUTE;

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
