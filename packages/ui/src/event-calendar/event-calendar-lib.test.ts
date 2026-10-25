import { afterEach, describe, expect, it } from "vitest";

import {
  atWallMinutes,
  getGutterReferenceDay,
  segmentOccurrence,
  wallMinutesOfDay,
  zonedStartOfDay,
} from "./event-calendar-lib";
import type { EventCalendarOccurrence } from "./event-calendar-types";

const timeZone = "America/Chicago";

const wallClock = (date: Date) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

const day = (iso: string) => zonedStartOfDay(new Date(iso), timeZone);

// US clocks fall back at 02:00 on Sun 2026-11-01 and spring forward at 02:00
// on Sun 2027-03-14. A Sunday-start week view uses the transition day as its
// first column, which is the day the time gutter labels are read from.
describe("time grid wall clock in America/Chicago", () => {
  it.each([
    ["fall back", "2026-11-01T18:00:00Z"],
    ["spring forward", "2027-03-14T18:00:00Z"],
  ])("labels every row of a %s week with the time a click on another day picks", (_, sunday) => {
    const week = Array.from({ length: 7 }, (_, i) =>
      day(new Date(new Date(sunday).getTime() + i * 86_400_000).toISOString()),
    );
    const reference = getGutterReferenceDay(week, timeZone)!;
    for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
      const label = wallClock(atWallMinutes(reference, minutes, timeZone));
      const picked = wallClock(atWallMinutes(week[2]!, minutes, timeZone));
      expect(label.slice(-5)).toBe(picked.slice(-5));
    }
  });

  it("picks the row's wall-clock time on the transition day", () => {
    expect(atWallMinutes(day("2026-11-01T18:00:00Z"), 600, timeZone)).toEqual(
      new Date("2026-11-01T16:00:00Z"),
    );
    expect(atWallMinutes(day("2027-03-14T18:00:00Z"), 600, timeZone)).toEqual(
      new Date("2027-03-14T15:00:00Z"),
    );
  });

  it("resolves a skipped time forward and a repeated time to its first occurrence", () => {
    expect(atWallMinutes(day("2027-03-14T18:00:00Z"), 150, timeZone)).toEqual(
      new Date("2027-03-14T08:30:00Z"),
    );
    expect(atWallMinutes(day("2026-11-01T18:00:00Z"), 90, timeZone)).toEqual(
      new Date("2026-11-01T06:30:00Z"),
    );
  });

  it("measures minutes on the wall clock, ending the day at 1440", () => {
    const fallBack = day("2026-11-01T18:00:00Z");
    expect(
      wallMinutesOfDay(new Date("2026-11-01T16:00:00Z"), fallBack, timeZone),
    ).toBe(600);
    expect(
      wallMinutesOfDay(day("2026-11-02T18:00:00Z"), fallBack, timeZone),
    ).toBe(1440);
  });

  it("positions an event on the transition day at its wall-clock rows", () => {
    const start = new Date("2026-11-01T16:00:00Z");
    const end = new Date("2026-11-01T17:00:00Z");
    const occurrence = {
      start,
      end,
      allDay: false,
    } as EventCalendarOccurrence;
    const [segment] = segmentOccurrence(
      occurrence,
      {
        start: day("2026-11-01T18:00:00Z"),
        end: day("2026-11-08T18:00:00Z"),
      },
      timeZone,
    );
    expect(segment).toMatchObject({ startMin: 600, endMin: 660 });
  });
});

describe("a floating UTC grid under a system zone with DST", () => {
  const originalTimeZone = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTimeZone;
  });

  it("maps every row of the system zone's transition days to its own time", () => {
    process.env.TZ = "America/Chicago";
    expect(new Date(2027, 2, 15).getTimezoneOffset()).toBe(300);
    for (const date of ["2027-03-14", "2026-11-01"]) {
      const day = zonedStartOfDay(new Date(`${date}T12:00:00Z`), "UTC");
      for (let minutes = 0; minutes < 24 * 60; minutes += 30) {
        expect(atWallMinutes(day, minutes, "UTC").getTime()).toBe(
          day.getTime() + minutes * 60_000,
        );
      }
    }
  });
});
