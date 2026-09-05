import { Hono } from "hono";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/kv", () => ({ redis: null }));

import type { RateLimitFailure } from "./rate-limit";
import { rateLimit } from "./rate-limit";

describe("rateLimit middleware without a store", () => {
  it("fails closed with 503 instead of letting traffic through unmetered", async () => {
    let failure: RateLimitFailure | undefined;
    const app = new Hono<{
      Variables: {
        apiAuth: { spaceId: string };
        rateLimitFailure?: RateLimitFailure;
      };
    }>();
    app.get(
      "/",
      async (c, next) => {
        c.set("apiAuth", { spaceId: "space-1" });
        await next();
        failure = c.get("rateLimitFailure");
      },
      rateLimit,
      (c) => c.json({ ok: true }),
    );

    const res = await app.request("/");

    expect(res.status).toBe(503);
    expect(res.headers.get("Retry-After")).toBe("60");
    expect((await res.json()).error.code).toBe("SERVICE_UNAVAILABLE");
    expect(failure).toEqual({
      reason: "store_unavailable",
      message: "Rate limit store is not configured",
    });
  });
});
