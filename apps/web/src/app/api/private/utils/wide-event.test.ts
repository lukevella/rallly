import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";

const info = vi.fn();
const warn = vi.fn();
const error = vi.fn();

vi.mock("@rallly/logger", () => ({
  logger: {
    info: (event: unknown) => info(event),
    warn: (event: unknown) => warn(event),
    error: (event: unknown) => error(event),
  },
  createWideEvent: (event: Record<string, unknown>) => ({
    timestamp: "2026-01-01T00:00:00.000Z",
    ...event,
  }),
}));

import type { RateLimitFailure, RateLimitInfo } from "./rate-limit";
import { wideEvent } from "./wide-event";

type TestEnv = {
  Variables: {
    apiAuth?: { spaceId: string; apiKeyId: string };
    rateLimit?: RateLimitInfo;
    rateLimitFailure?: RateLimitFailure;
  };
};

const window = (limit: number, used: number) => ({
  limit,
  used,
  remaining: limit - used,
  resetTime: new Date("2026-01-01T00:01:00.000Z"),
});

const buildApp = () => {
  const app = new Hono<TestEnv>();
  app.use("*", wideEvent);

  app.get(
    "/ok",
    async (c, next) => {
      c.set("apiAuth", { spaceId: "space-1", apiKeyId: "key-1" });
      c.set("rateLimit", { minute: window(5, 1), day: window(100, 7) });
      await next();
    },
    (c) => c.json({ ok: true }),
  );

  app.get(
    "/store-down",
    async (c, next) => {
      c.set("apiAuth", { spaceId: "space-1", apiKeyId: "key-1" });
      await next();
    },
    (c) => {
      c.set("rateLimitFailure", {
        reason: "store_error",
        message: "connection refused",
      });
      return c.json({ error: {} }, 503);
    },
  );

  app.get(
    "/unauthorized",
    bearerAuth({ verifyToken: async () => false }),
    (c) => c.json({ ok: true }),
  );

  app.get("/boom", () => {
    throw new Error("kaboom");
  });

  return app;
};

describe("wideEvent middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits a single info event with request, auth and rate-limit context on success", async () => {
    const res = await buildApp().request("/ok");

    expect(res.status).toBe(200);
    expect(info).toHaveBeenCalledTimes(1);
    expect(warn).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();

    const event = info.mock.calls[0][0];
    expect(event).toMatchObject({
      service: "private-api",
      method: "GET",
      path: "/ok",
      statusCode: 200,
      spaceId: "space-1",
      apiKeyId: "key-1",
      rateLimiter: "private-api",
      rateLimiterConsumedPoints: 1,
      rateLimiterRemainingPoints: 4,
      rateLimiterDailyConsumedPoints: 7,
      rateLimiterDailyRemainingPoints: 93,
    });
    expect(typeof event.durationMs).toBe("number");
  });

  it("logs an error event with the store failure when the limiter fails closed", async () => {
    const res = await buildApp().request("/store-down");

    expect(res.status).toBe(503);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0]).toMatchObject({
      statusCode: 503,
      spaceId: "space-1",
      rateLimiter: "private-api",
      rateLimiterError: "store_error",
      errorType: "RateLimitStoreError",
      errorCode: "SERVICE_UNAVAILABLE",
      errorMessage: "connection refused",
      isRetriable: true,
    });
  });

  it("warns and captures a 401 without auth context", async () => {
    const res = await buildApp().request("/unauthorized");

    expect(res.status).toBe(401);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(info).not.toHaveBeenCalled();

    const event = warn.mock.calls[0][0];
    expect(event).toMatchObject({ statusCode: 401, path: "/unauthorized" });
    expect(event.spaceId).toBeUndefined();
    expect(event.apiKeyId).toBeUndefined();
    expect(event.rateLimiter).toBeUndefined();
  });

  it("logs an error event with error details on an unhandled throw", async () => {
    const res = await buildApp().request("/boom");

    expect(res.status).toBe(500);
    expect(error).toHaveBeenCalledTimes(1);

    const event = error.mock.calls[0][0];
    expect(event).toMatchObject({
      statusCode: 500,
      errorType: "Error",
      errorMessage: "kaboom",
    });
  });

  it("propagates the request id from x-vercel-id", async () => {
    await buildApp().request("/ok", {
      headers: { "x-vercel-id": "req-123" },
    });

    expect(info.mock.calls[0][0].requestId).toBe("req-123");
  });
});
