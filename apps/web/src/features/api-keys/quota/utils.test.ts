import { describe, expect, it } from "vitest";
import {
  getQuotaWarningLevel,
  resolveApiPollLimit,
  startOfNextUtcMonth,
  startOfUtcMonth,
} from "./utils";

const now = new Date("2026-11-12T10:00:00Z");
const tomorrow = new Date("2026-11-13T10:00:00Z");
const yesterday = new Date("2026-11-11T10:00:00Z");

describe("resolveApiPollLimit", () => {
  const base = {
    addonLimit: null,
    retainedLimit: null,
    retainedUntil: null,
    override: null,
    now,
  };

  it("falls back to the included amount", () => {
    expect(resolveApiPollLimit(base)).toBe(50);
  });

  it("uses the add-on limit rather than adding to the included amount", () => {
    expect(resolveApiPollLimit({ ...base, addonLimit: 250 })).toBe(250);
  });

  it("takes the override when it is higher than the add-on", () => {
    expect(
      resolveApiPollLimit({ ...base, override: 500, addonLimit: 250 }),
    ).toBe(500);
  });

  it("takes the add-on when it is higher than the override", () => {
    expect(
      resolveApiPollLimit({ ...base, override: 500, addonLimit: 1000 }),
    ).toBe(1000);
  });

  it("never lowers the limit below the included amount", () => {
    expect(resolveApiPollLimit({ ...base, override: 20 })).toBe(50);
  });

  it("honours a retained limit until it expires", () => {
    expect(
      resolveApiPollLimit({
        ...base,
        retainedLimit: 1000,
        retainedUntil: tomorrow,
        addonLimit: 250,
      }),
    ).toBe(1000);
  });

  it("ignores an expired retained limit", () => {
    expect(
      resolveApiPollLimit({
        ...base,
        retainedLimit: 1000,
        retainedUntil: yesterday,
        addonLimit: 250,
      }),
    ).toBe(250);
  });
});

describe("utc month boundaries", () => {
  it("finds the start of the month", () => {
    expect(
      startOfUtcMonth(new Date("2026-11-30T23:59:59Z")).toISOString(),
    ).toBe("2026-11-01T00:00:00.000Z");
  });

  it("finds the start of the next month in UTC", () => {
    expect(
      startOfNextUtcMonth(new Date("2026-12-31T23:30:00-05:00")).toISOString(),
    ).toBe("2027-02-01T00:00:00.000Z");
  });
});

describe("getQuotaWarningLevel", () => {
  it("is null below 80%", () => {
    expect(getQuotaWarningLevel({ count: 39, limit: 50 })).toBeNull();
  });

  it("is near_limit from 80%", () => {
    expect(getQuotaWarningLevel({ count: 40, limit: 50 })).toBe("near_limit");
    expect(getQuotaWarningLevel({ count: 200, limit: 250 })).toBe("near_limit");
  });

  it("is at_limit at and above the limit", () => {
    expect(getQuotaWarningLevel({ count: 50, limit: 50 })).toBe("at_limit");
    expect(getQuotaWarningLevel({ count: 51, limit: 50 })).toBe("at_limit");
  });
});
