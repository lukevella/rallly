import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FakeRedis } from "./fake-redis";

vi.mock("server-only", () => ({}));

let clock = Date.parse("2026-01-01T00:00:00.000Z");

vi.mock("@/lib/kv", async () => ({
  redis: (await import("./fake-redis")).createFakeRedis({ now: () => clock }),
}));

import { redis } from "@/lib/kv";
import type { RateLimitFailure, RateLimitInfo } from "./rate-limit";
import {
  pickBindingWindow,
  RATE_LIMIT_PER_DAY,
  RATE_LIMIT_PER_MINUTE,
  rateLimit,
} from "./rate-limit";

const fakeRedis = redis as unknown as FakeRedis;

type TestEnv = {
  Variables: {
    apiAuth: { spaceId: string };
    rateLimit?: RateLimitInfo;
    rateLimitFailure?: RateLimitFailure;
  };
};

const buildApp = () => {
  const app = new Hono<TestEnv>();
  let captured: {
    rateLimit?: RateLimitInfo;
    rateLimitFailure?: RateLimitFailure;
  } = {};

  app.get(
    "/",
    async (c, next) => {
      c.set("apiAuth", { spaceId: "space-1" });
      await next();
      captured = {
        rateLimit: c.get("rateLimit"),
        rateLimitFailure: c.get("rateLimitFailure"),
      };
    },
    rateLimit,
    (c) => c.json({ ok: true }),
  );

  return { app, captured: () => captured };
};

const drain = async (app: Hono<TestEnv>, count: number) => {
  for (let i = 0; i < count; i++) {
    await app.request("/");
  }
};

describe("rateLimit middleware", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clock = Date.parse("2026-01-01T00:00:00.000Z");
    vi.setSystemTime(clock);
    fakeRedis.reset();
  });

  it("counts a request against both windows and reports the closest one", async () => {
    const { app, captured } = buildApp();

    const res = await app.request("/");

    expect(res.status).toBe(200);
    expect(res.headers.get("RateLimit-Policy")).toBe(
      `${RATE_LIMIT_PER_MINUTE};w=60, ${RATE_LIMIT_PER_DAY};w=86400`,
    );
    expect(res.headers.get("RateLimit-Limit")).toBe(
      String(RATE_LIMIT_PER_MINUTE),
    );
    expect(res.headers.get("RateLimit-Remaining")).toBe(
      String(RATE_LIMIT_PER_MINUTE - 1),
    );
    expect(res.headers.get("RateLimit-Reset")).toBe("60");
    expect(captured().rateLimit).toMatchObject({
      minute: { used: 1, remaining: RATE_LIMIT_PER_MINUTE - 1 },
      day: { used: 1, remaining: RATE_LIMIT_PER_DAY - 1 },
    });
  });

  it("returns 429 once the per-minute limit is exceeded", async () => {
    const { app } = buildApp();
    await drain(app, RATE_LIMIT_PER_MINUTE);

    const res = await app.request("/");

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect(res.headers.get("RateLimit-Remaining")).toBe("0");
    expect((await res.json()).error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("returns 429 once the daily limit is exceeded even when the minute window is fresh", async () => {
    const { app } = buildApp();
    const minuteMs = 60_000;

    // Spread the daily quota over enough minutes that no minute window trips.
    let sent = 0;
    let minutesElapsed = 0;
    while (sent < RATE_LIMIT_PER_DAY) {
      const batch = Math.min(RATE_LIMIT_PER_MINUTE, RATE_LIMIT_PER_DAY - sent);
      await drain(app, batch);
      sent += batch;
      clock += minuteMs;
      minutesElapsed += 1;
      vi.setSystemTime(clock);
    }

    const res = await app.request("/");

    expect(res.status).toBe(429);
    expect((await res.json()).error.code).toBe("RATE_LIMIT_EXCEEDED");
    expect(res.headers.get("RateLimit-Limit")).toBe(String(RATE_LIMIT_PER_DAY));
    expect(res.headers.get("RateLimit-Remaining")).toBe("0");
    // The day key was armed at the first request; Retry-After points at it.
    expect(res.headers.get("Retry-After")).toBe(
      String(86400 - minutesElapsed * 60),
    );
  });

  it("scopes both windows to the space", async () => {
    const { app } = buildApp();
    await drain(app, 3);

    expect(fakeRedis.hits("hrl:private-api:space-1")).toBe(3);
    expect(fakeRedis.hits("hrl:private-api:daily:space-1")).toBe(3);
    expect(fakeRedis.hits("hrl:private-api:space-2")).toBe(0);
  });

  it("fails closed with 503 when the store throws", async () => {
    const { app, captured } = buildApp();
    fakeRedis.failNextCallsWith(new Error("connection refused"));

    const res = await app.request("/");

    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect((await res.json()).error.code).toBe("SERVICE_UNAVAILABLE");
    expect(captured().rateLimitFailure).toEqual({
      reason: "store_error",
      message: "connection refused",
    });
    expect(captured().rateLimit).toBeUndefined();
  });
});

describe("pickBindingWindow", () => {
  const window = (limit: number, used: number) => ({
    limit,
    used,
    remaining: Math.max(limit - used, 0),
    resetTime: new Date(0),
  });

  it("prefers the minute window when it has the smaller share of quota left", () => {
    const info = { minute: window(60, 30), day: window(5000, 100) };
    expect(pickBindingWindow(info)).toBe(info.minute);
  });

  it("prefers the day window when it is closer to exhaustion", () => {
    const info = { minute: window(60, 1), day: window(5000, 4990) };
    expect(pickBindingWindow(info)).toBe(info.day);
  });

  it("breaks ties toward the minute window", () => {
    const info = { minute: window(60, 0), day: window(5000, 0) };
    expect(pickBindingWindow(info)).toBe(info.minute);
  });
});
