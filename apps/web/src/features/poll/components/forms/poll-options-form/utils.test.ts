import { afterEach, describe, expect, it } from "vitest";
import { getNextAvailableTimeSlotStart, getTimeOptions } from "./utils";

const hoursOf = (options: string[]) =>
  [...new Set(options.map((option) => option.slice(11, 13)))].join(",");

describe("getNextAvailableTimeSlotStart", () => {
  it("rounds up to the next future 15-minute slot in the poll timezone", () => {
    expect(
      getNextAvailableTimeSlotStart({
        date: "2026-10-29",
        now: new Date("2026-10-29T19:07:00Z"),
        timeZone: "America/Los_Angeles",
      }),
    ).toBe("2026-10-29T12:15:00");
  });

  it("skips the current slot when now is exactly on a 15-minute boundary", () => {
    expect(
      getNextAvailableTimeSlotStart({
        date: "2026-10-29",
        now: new Date("2026-10-29T12:15:00Z"),
        timeZone: "UTC",
      }),
    ).toBe("2026-10-29T12:30:00");
  });

  it("skips missing wall-clock times during a daylight-saving transition", () => {
    expect(
      getNextAvailableTimeSlotStart({
        date: "2027-03-14",
        now: new Date("2027-03-14T07:50:00Z"),
        timeZone: "America/Chicago",
      }),
    ).toBe("2027-03-14T03:00:00");
  });

  it("returns null when the date is not today or no time remains today", () => {
    expect(
      getNextAvailableTimeSlotStart({
        date: "2026-10-30",
        now: new Date("2026-10-29T23:50:00Z"),
        timeZone: "UTC",
      }),
    ).toBeNull();
    expect(
      getNextAvailableTimeSlotStart({
        date: "2026-10-29",
        now: new Date("2026-10-29T23:50:00Z"),
        timeZone: "UTC",
      }),
    ).toBeNull();
  });
});

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
