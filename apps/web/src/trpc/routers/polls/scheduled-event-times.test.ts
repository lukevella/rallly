import { describe, expect, it } from "vitest";
import { getScheduledEventTimes } from "./scheduled-event-times";

describe("getScheduledEventTimes", () => {
  it("keeps the poll's time zone on timed events", () => {
    const result = getScheduledEventTimes({
      startTime: new Date("2026-03-23T14:00:00Z"),
      duration: 60,
      timeZone: "America/Toronto",
    });
    expect(result).toEqual({
      allDay: false,
      start: new Date("2026-03-23T14:00:00Z"),
      end: new Date("2026-03-23T15:00:00Z"),
      timeZone: "America/Toronto",
    });
  });

  it("keeps a null time zone on floating timed events", () => {
    const result = getScheduledEventTimes({
      startTime: new Date("2026-03-23T14:00:00Z"),
      duration: 30,
      timeZone: null,
    });
    expect(result.timeZone).toBeNull();
    expect(result.end).toEqual(new Date("2026-03-23T14:30:00Z"));
  });

  it("encodes all-day events from date-only polls as a floating UTC midnight day span", () => {
    const result = getScheduledEventTimes({
      startTime: new Date("2026-03-23T00:00:00Z"),
      duration: 0,
      timeZone: null,
    });
    expect(result).toEqual({
      allDay: true,
      start: new Date("2026-03-23T00:00:00Z"),
      end: new Date("2026-03-24T00:00:00Z"),
      timeZone: null,
    });
  });

  it("drops the poll's time zone from all-day events without shifting a UTC midnight start", () => {
    const result = getScheduledEventTimes({
      startTime: new Date("2026-03-23T00:00:00Z"),
      duration: 0,
      timeZone: "America/Toronto",
    });
    expect(result).toEqual({
      allDay: true,
      start: new Date("2026-03-23T00:00:00Z"),
      end: new Date("2026-03-24T00:00:00Z"),
      timeZone: null,
    });
  });

  it("snaps a legacy zone-midnight all-day option west of UTC to the zone's calendar date", () => {
    // midnight Oct 17 in Chicago = 05:00Z
    const result = getScheduledEventTimes({
      startTime: new Date("2025-10-17T05:00:00Z"),
      duration: 0,
      timeZone: "America/Chicago",
    });
    expect(result).toEqual({
      allDay: true,
      start: new Date("2025-10-17T00:00:00Z"),
      end: new Date("2025-10-18T00:00:00Z"),
      timeZone: null,
    });
  });

  it("snaps a legacy zone-midnight all-day option east of UTC to the zone's calendar date", () => {
    // midnight Oct 17 in Tokyo = Oct 16 15:00Z
    const result = getScheduledEventTimes({
      startTime: new Date("2025-10-16T15:00:00Z"),
      duration: 0,
      timeZone: "Asia/Tokyo",
    });
    expect(result).toEqual({
      allDay: true,
      start: new Date("2025-10-17T00:00:00Z"),
      end: new Date("2025-10-18T00:00:00Z"),
      timeZone: null,
    });
  });
});
