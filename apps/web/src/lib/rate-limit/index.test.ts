import type { WideEvent } from "@rallly/logger";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/env", () => ({ env: {} }));

import { createBudget, createRateLimitGuard } from "./index";

describe("createBudget", () => {
  it("grants what is left and nothing past it", async () => {
    const budget = createBudget(10, "24 h");
    expect(await budget?.reserve("a", 7)).toBe(7);
    expect(await budget?.reserve("a", 5)).toBe(3);
    expect(await budget?.reserve("a", 1)).toBe(0);
    expect(await budget?.reserve("b", 4)).toBe(4);
  });

  it("never grants more than the allowance to concurrent reservations", async () => {
    const budget = createBudget(10, "24 h");
    const grants = await Promise.all(
      Array.from({ length: 8 }, () => budget?.reserve("a", 3)),
    );
    expect(grants.reduce((sum = 0, n = 0) => sum + n, 0)).toBe(10);
  });
});

describe("createRateLimitGuard", () => {
  it("refuses a scripted loop of responses against one poll after the cap", async () => {
    const guard = createRateLimitGuard(200, "1 h");
    const key = "add_participant:poll:poll-1";

    for (let i = 0; i < 200; i++) {
      await guard(key);
    }

    const event: WideEvent = { service: "action" };
    await expect(guard(key, event)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(event).toMatchObject({
      rateLimiter: "memory",
      rateLimiterRemainingPoints: 0,
    });
    await expect(guard("add_participant:poll:poll-2")).resolves.toBeUndefined();
  });

  it("keeps the lowest remaining count when several guards run", async () => {
    const perIp = createRateLimitGuard(10, "1 m");
    const perPoll = createRateLimitGuard(200, "1 h");
    const event: WideEvent = { service: "action" };

    await perIp("ip:1.2.3.4", event);
    await perPoll("poll:poll-1", event);

    expect(event.rateLimiterRemainingPoints).toBe(9);
  });
});
