import { describe, expect, it } from "vitest";
import {
  getOpenPollLimit,
  getOpenPollTier,
  isAtOpenPollLimit,
  isNearOpenPollLimit,
} from "./utils";

describe("getOpenPollLimit", () => {
  it("is 1 for guests, 3 for free and unlimited on Pro", () => {
    expect(getOpenPollLimit({ tier: "guest", enabled: true })).toBe(1);
    expect(getOpenPollLimit({ tier: "hobby", enabled: true })).toBe(3);
    expect(getOpenPollLimit({ tier: "pro", enabled: true })).toBeNull();
  });

  it("is unlimited for every tier while enforcement is off", () => {
    for (const tier of ["guest", "hobby", "pro"] as const) {
      expect(getOpenPollLimit({ tier, enabled: false })).toBeNull();
    }
  });
});

describe("getOpenPollTier", () => {
  it("treats a poll outside any space as a guest's", () => {
    expect(getOpenPollTier(null)).toBe("guest");
  });
});

describe("isAtOpenPollLimit", () => {
  it("is reached at the limit and past it", () => {
    expect(isAtOpenPollLimit({ tier: "hobby", limit: 3, openCount: 2 })).toBe(
      false,
    );
    expect(isAtOpenPollLimit({ tier: "hobby", limit: 3, openCount: 3 })).toBe(
      true,
    );
    expect(isAtOpenPollLimit({ tier: "hobby", limit: 3, openCount: 5 })).toBe(
      true,
    );
  });

  it("is never reached without a limit", () => {
    expect(
      isAtOpenPollLimit({ tier: "pro", limit: null, openCount: 1000 }),
    ).toBe(false);
  });
});

describe("isNearOpenPollLimit", () => {
  it("is reached one poll short of the limit", () => {
    expect(isNearOpenPollLimit({ tier: "hobby", limit: 3, openCount: 1 })).toBe(
      false,
    );
    expect(isNearOpenPollLimit({ tier: "hobby", limit: 3, openCount: 2 })).toBe(
      true,
    );
    expect(isNearOpenPollLimit({ tier: "hobby", limit: 3, openCount: 5 })).toBe(
      true,
    );
  });

  it("is never reached without a limit", () => {
    expect(
      isNearOpenPollLimit({ tier: "pro", limit: null, openCount: 1000 }),
    ).toBe(false);
  });
});
