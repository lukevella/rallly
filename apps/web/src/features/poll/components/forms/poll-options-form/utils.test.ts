import { afterEach, describe, expect, it } from "vitest";
import { getTimeOptions } from "./utils";

const hoursOf = (options: string[]) =>
  [...new Set(options.map((option) => option.slice(11, 13)))].join(",");

describe("getTimeOptions", () => {
  const originalTimeZone = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTimeZone;
  });

  it.each([
    "America/Chicago",
    "Asia/Kathmandu",
  ])("offers the poll zone's times whatever the browser's zone (%s)", (browserTimeZone) => {
    process.env.TZ = browserTimeZone;
    const chicago = getTimeOptions({
      value: "2027-03-14T12:00:00",
      timeZone: "America/Chicago",
    });
    expect(chicago).toHaveLength(92);
    expect(hoursOf(chicago)).not.toContain("02");
    expect(chicago).toContain("2027-03-14T01:45:00");
    expect(chicago).toContain("2027-03-14T03:00:00");

    const kathmandu = getTimeOptions({
      value: "2027-03-14T12:00:00",
      timeZone: "Asia/Kathmandu",
    });
    expect(kathmandu).toHaveLength(96);
    expect(kathmandu).toContain("2027-03-14T02:30:00");
  });

  it("keeps the repeated fall back hour once", () => {
    const options = getTimeOptions({
      value: "2026-11-01T12:00:00",
      timeZone: "America/Chicago",
    });
    expect(options).toHaveLength(96);
    expect(new Set(options).size).toBe(96);
  });

  it("offers every time for a poll without a zone", () => {
    expect(getTimeOptions({ value: "2027-03-14T12:00:00" })).toHaveLength(96);
  });

  it("keeps the current value even when the zone skips it", () => {
    expect(
      getTimeOptions({
        value: "2027-03-14T02:30:00",
        timeZone: "America/Chicago",
      }),
    ).toContain("2027-03-14T02:30:00");
  });

  it("offers end times inside the skipped hour", () => {
    expect(
      getTimeOptions({
        value: "2027-03-14T02:30:00",
        after: "2027-03-14T01:30:00",
        timeZone: "America/Chicago",
      }),
    ).toContain("2027-03-14T02:30:00");
  });

  it("offers the 24 hours after a start, past midnight", () => {
    const options = getTimeOptions({
      value: "2026-11-03T23:30:00",
      after: "2026-11-03T23:00:00",
      timeZone: "America/Chicago",
    });
    expect(options[0]).toBe("2026-11-03T23:15:00");
    expect(options.at(-1)).toBe("2026-11-04T23:00:00");
    expect(options).toHaveLength(96);
  });
});
