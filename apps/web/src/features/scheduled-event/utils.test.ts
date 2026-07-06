import { describe, expect, it } from "vitest";
import { formatEventDateTime } from "./utils";

// 26 Jun 2026, 13:00–14:00 UTC.
const start = new Date(Date.UTC(2026, 5, 26, 13));
const end = new Date(Date.UTC(2026, 5, 26, 14));

describe("formatEventDateTime", () => {
  it("formats all-day events in UTC with no time", () => {
    const result = formatEventDateTime({
      start: new Date(Date.UTC(2026, 5, 26)),
      end: new Date(Date.UTC(2026, 5, 27)),
      allDay: true,
      timeZone: null,
      inviteeTimeZone: "America/New_York",
    });
    expect(result).toEqual({
      date: "June 26, 2026",
      day: "26",
      dow: "Fri",
      time: undefined,
    });
  });

  it("renders fixed events in the invitee's zone with a zone name", () => {
    const result = formatEventDateTime({
      start,
      end,
      allDay: false,
      timeZone: "Europe/London",
      inviteeTimeZone: "America/New_York",
    });
    expect(result.date).toBe("June 26, 2026");
    expect(result.time).toContain("9:00");
    expect(result.time).toMatch(/10:00\sAM/);
    expect(result.time).toContain("EDT");
  });

  it("falls back to the event zone when the invitee zone is unknown", () => {
    const result = formatEventDateTime({
      start,
      end,
      allDay: false,
      timeZone: "Europe/London",
    });
    expect(result.time).toContain("2:00");
    expect(result.time).toMatch(/3:00\sPM/);
  });

  it("renders floating events as UTC wall time with no zone name", () => {
    const result = formatEventDateTime({
      start,
      end,
      allDay: false,
      timeZone: null,
      inviteeTimeZone: "America/New_York",
    });
    expect(result.time).toContain("1:00");
    expect(result.time).toMatch(/2:00\sPM/);
    expect(result.time).not.toMatch(/GMT|UTC|[A-Z]{3,4}$/);
  });

  it("respects the recipient's preferred time format", () => {
    const result = formatEventDateTime({
      start,
      end,
      allDay: false,
      timeZone: "Europe/London",
      timeFormat: "hours24",
    });
    expect(result.time).toContain("14:00");
    expect(result.time).not.toMatch(/PM/i);
  });

  it("formats in the recipient's locale", () => {
    const result = formatEventDateTime({
      start,
      end,
      allDay: false,
      timeZone: "Europe/Berlin",
      locale: "de",
    });
    expect(result.date).toBe("26. Juni 2026");
    expect(result.time).toContain("15:00");
  });
});
