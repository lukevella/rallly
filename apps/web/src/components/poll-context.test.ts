import { describe, expect, it } from "vitest";

import { createOptionsContextValue } from "./poll-context";

// An all-day option is a floating date: "July 1" everywhere on Earth. It must
// render as the same calendar date regardless of the poll timezone (source) or
// the viewer timezone (target). Regression test for the bug where date options
// were timezone-shifted, so a viewer in an earlier timezone saw the prior day.
describe("createOptionsContextValue — all-day options are timezone-invariant", () => {
  const allDayOption = {
    id: "opt-1",
    startTime: new Date("2026-07-01T00:00:00Z"),
    duration: 0,
  };

  it.each([
    ["America/Los_Angeles", "Europe/Berlin"], // viewer far behind source
    ["Europe/Berlin", "America/Los_Angeles"], // viewer far ahead of source
    ["Asia/Tokyo", "Europe/Berlin"],
    ["UTC", "Europe/Berlin"],
  ])("renders Jul 1 for target=%s, source=%s", (targetTimeZone, sourceTimeZone) => {
    const result = createOptionsContextValue(
      [allDayOption],
      targetTimeZone,
      sourceTimeZone,
    );

    expect(result.pollType).toBe("date");
    expect(result.options[0]).toMatchObject({
      type: "date",
      day: "1",
      month: "Jul",
      year: "2026",
    });
  });

  it("does not shift when the poll has no timezone", () => {
    const result = createOptionsContextValue(
      [allDayOption],
      "America/Los_Angeles",
      null,
    );

    expect(result.options[0]).toMatchObject({ day: "1", month: "Jul" });
  });
});
