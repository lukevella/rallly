import { describe, expect, it } from "vitest";
import {
  getActivePollLimit,
  getActivePollTier,
  isAtActivePollLimit,
} from "./utils";

describe("getActivePollLimit", () => {
  it("is 1 for guests, 3 for free and unlimited on Pro", () => {
    expect(getActivePollLimit({ tier: "guest", enabled: true })).toBe(1);
    expect(getActivePollLimit({ tier: "hobby", enabled: true })).toBe(3);
    expect(getActivePollLimit({ tier: "pro", enabled: true })).toBeNull();
  });

  it("is unlimited for every tier while enforcement is off", () => {
    for (const tier of ["guest", "hobby", "pro"] as const) {
      expect(getActivePollLimit({ tier, enabled: false })).toBeNull();
    }
  });
});

describe("getActivePollTier", () => {
  it("treats a poll outside any space as a guest's", () => {
    expect(getActivePollTier(null)).toBe("guest");
  });
});

describe("isAtActivePollLimit", () => {
  it("is reached at the limit and past it", () => {
    expect(
      isAtActivePollLimit({ tier: "hobby", limit: 3, activeCount: 2 }),
    ).toBe(false);
    expect(
      isAtActivePollLimit({ tier: "hobby", limit: 3, activeCount: 3 }),
    ).toBe(true);
    expect(
      isAtActivePollLimit({ tier: "hobby", limit: 3, activeCount: 5 }),
    ).toBe(true);
  });

  it("is never reached without a limit", () => {
    expect(
      isAtActivePollLimit({ tier: "pro", limit: null, activeCount: 1000 }),
    ).toBe(false);
  });
});
