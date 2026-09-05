import { Hono } from "hono";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/kv", () => ({ redis: null }));
vi.mock("@/lib/feature-flags/server", () => ({
  isFeatureEnabled: (feature: string) => feature === "inProcessRateLimit",
}));

import {
  RATE_LIMIT_PER_DAY,
  RATE_LIMIT_PER_MINUTE,
  rateLimit,
} from "./rate-limit";

const buildApp = (spaceId: string) => {
  const app = new Hono<{ Variables: { apiAuth: { spaceId: string } } }>();
  app.get(
    "/",
    async (c, next) => {
      c.set("apiAuth", { spaceId });
      await next();
    },
    rateLimit,
    (c) => c.json({ ok: true }),
  );
  return app;
};

describe("rateLimit middleware with the in-process store", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(Date.parse("2026-01-01T00:00:00.000Z"));
  });

  it("serves requests without Redis when the capability is on", async () => {
    // The store is module-level, so use a space no other test touches.
    const res = await buildApp("in-process-a").request("/");

    expect(res.status).toBe(200);
    expect(res.headers.get("RateLimit-Policy")).toBe(
      `${RATE_LIMIT_PER_MINUTE};w=60, ${RATE_LIMIT_PER_DAY};w=86400`,
    );
    expect(res.headers.get("RateLimit-Remaining")).toBe(
      String(RATE_LIMIT_PER_MINUTE - 1),
    );
  });

  it("enforces the per-minute window and releases it when the window expires", async () => {
    const app = buildApp("in-process-b");
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) {
      await app.request("/");
    }

    const limited = await app.request("/");
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("60");

    vi.advanceTimersByTime(60_000);

    const released = await app.request("/");
    expect(released.status).toBe(200);
    expect(released.headers.get("RateLimit-Remaining")).toBe(
      String(RATE_LIMIT_PER_MINUTE - 1),
    );
  });

  it("keeps counters separate per space", async () => {
    const a = buildApp("in-process-c");
    const b = buildApp("in-process-d");
    for (let i = 0; i < RATE_LIMIT_PER_MINUTE; i++) {
      await a.request("/");
    }

    expect((await a.request("/")).status).toBe(429);
    expect((await b.request("/")).status).toBe(200);
  });
});
