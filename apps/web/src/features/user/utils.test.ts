import { describe, expect, it } from "vitest";
import { getInactivityCutoff } from "./utils";

describe("getInactivityCutoff", () => {
  it("subtracts the period's days from the supplied instant", () => {
    const now = new Date("2026-08-20T10:30:00.000Z");

    expect(getInactivityCutoff("30d", now).toISOString()).toBe(
      "2026-07-21T10:30:00.000Z",
    );
    expect(getInactivityCutoff("90d", now).toISOString()).toBe(
      "2026-05-22T10:30:00.000Z",
    );
    expect(getInactivityCutoff("365d", now).toISOString()).toBe(
      "2025-08-20T10:30:00.000Z",
    );
  });

  it("crosses a leap day without drifting", () => {
    // 2024 is a leap year: 30 days back from 2024-03-10 lands on 2024-02-09,
    // which only holds if February's 29 days are counted.
    const now = new Date("2024-03-10T00:00:00.000Z");

    expect(getInactivityCutoff("30d", now).toISOString()).toBe(
      "2024-02-09T00:00:00.000Z",
    );
  });

  it("does not mutate the supplied instant", () => {
    const now = new Date("2026-08-20T10:30:00.000Z");

    getInactivityCutoff("180d", now);

    expect(now.toISOString()).toBe("2026-08-20T10:30:00.000Z");
  });
});
