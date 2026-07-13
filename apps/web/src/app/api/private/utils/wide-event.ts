import { createWideEvent, logger } from "@rallly/logger";
import { createMiddleware } from "hono/factory";
import type { RateLimitInfo } from "hono-rate-limiter";

type WideEventEnv = {
  Variables: {
    apiAuth?: {
      spaceId: string;
      apiKeyId: string;
    };
    rateLimit?: RateLimitInfo;
  };
};

/**
 * Emits a single wide event per request, following the "one event per request"
 * pattern in `packages/logger/src/wide-event.ts`. Registered first so it wraps
 * every outcome, including maintenance (503), auth (401/403), and rate limit
 * (429) short-circuits from downstream middleware.
 */
export const wideEvent = createMiddleware<WideEventEnv>(async (c, next) => {
  const startTime = Date.now();
  const event = createWideEvent({
    service: "private-api",
    requestId:
      c.req.header("x-vercel-id") ?? c.req.header("x-request-id") ?? undefined,
    method: c.req.method,
    path: c.req.path,
    ip: c.req.header("x-vercel-forwarded-for") ?? undefined,
    ja4Digest: c.req.header("x-vercel-ja4-digest") ?? undefined,
  });

  try {
    await next();

    // `c.res.status` is authoritative: Hono's error handler has already
    // resolved thrown HTTPExceptions (e.g. the 401 from bearer auth) into the
    // correct status. `c.error` is still set for those, so enrich error fields
    // from it but never let it override the resolved status.
    event.statusCode = c.res.status;

    if (c.error) {
      event.errorType = c.error.name;
      event.errorMessage = c.error.message;
    }
  } finally {
    // `apiAuth` and `rateLimit` are populated by downstream middleware, so they
    // are only available once `next()` has run — and stay absent when the
    // request is rejected before they run (401 unauthenticated, 403 non-pro).
    const apiAuth = c.get("apiAuth");
    if (apiAuth) {
      event.spaceId = apiAuth.spaceId;
      event.apiKeyId = apiAuth.apiKeyId;
    }

    const rateLimit = c.get("rateLimit");
    if (rateLimit) {
      event.rateLimiter = "private-api";
      event.rateLimiterConsumedPoints = rateLimit.used;
      event.rateLimiterRemainingPoints = rateLimit.remaining;
    }

    event.durationMs = Date.now() - startTime;

    if (event.statusCode && event.statusCode >= 500) {
      logger.error(event);
    } else if (event.statusCode && event.statusCode >= 400) {
      logger.warn(event);
    } else {
      logger.info(event);
    }
  }
});
