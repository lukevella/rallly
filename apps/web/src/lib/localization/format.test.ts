import { describe, expect, it } from "vitest";
import {
  formatDateTime,
  formatDateTimeRange,
  formatRelativeTime,
} from "@/lib/localization/format";

// Fri 26 Jun 2026, in UTC.
const at = (hour: number, minute = 0) =>
  new Date(Date.UTC(2026, 5, 26, hour, minute));

describe("formatDateTime", () => {
  it("formats 24-hour time", () => {
    expect(
      formatDateTime(at(13), "time", {
        locale: "en",
        timeFormat: "hours24",
        timeZone: "UTC",
      }),
    ).toBe("13:00");
  });

  it("formats 12-hour time", () => {
    const out = formatDateTime(at(13), "time", {
      locale: "en",
      timeFormat: "hours12",
      timeZone: "UTC",
    });
    expect(out).toMatch(/\bPM\b/i);
    expect(out).not.toContain("13");
  });

  it("applies the 12-hour override on a 24-hour-default locale (de)", () => {
    const out = formatDateTime(at(13), "time", {
      locale: "de",
      timeFormat: "hours12",
      timeZone: "UTC",
    });
    // Override applied → hour rendered as 1, not 13.
    expect(out).not.toContain("13");
  });

  it("preserves the locale separator under override (Finnish period)", () => {
    expect(
      formatDateTime(at(15, 30), "time", {
        locale: "fi",
        timeFormat: "hours24",
        timeZone: "UTC",
      }),
    ).toBe("15.30");
  });

  it("produces different output for hours12 vs hours24 (override applied)", () => {
    const base = { locale: "en", timeZone: "UTC" } as const;
    expect(
      formatDateTime(at(13), "time", { ...base, timeFormat: "hours12" }),
    ).not.toBe(
      formatDateTime(at(13), "time", { ...base, timeFormat: "hours24" }),
    );
  });

  it("converts to the given timezone", () => {
    // 13:00 UTC = 09:00 America/New_York (EDT) in June.
    expect(
      formatDateTime(at(13), "time", {
        locale: "en",
        timeFormat: "hours24",
        timeZone: "America/New_York",
      }),
    ).toBe("09:00");
  });

  it("formats a weekday", () => {
    expect(
      formatDateTime(at(13), "weekday", {
        locale: "en",
        timeFormat: "hours24",
        timeZone: "UTC",
      }),
    ).toBe("Friday");
  });

  it("formats a datetime with both date and time parts", () => {
    const out = formatDateTime(at(13), "datetime", {
      locale: "en",
      timeFormat: "hours24",
      timeZone: "UTC",
    });
    expect(out).toContain("2026");
    expect(out).toContain("13:00");
  });

  it("date preset omits the time", () => {
    const out = formatDateTime(at(13), "date", {
      locale: "en",
      timeFormat: "hours24",
      timeZone: "UTC",
    });
    expect(out).toContain("2026");
    expect(out).not.toContain("13:00");
  });

  it("accepts ISO strings and timestamps", () => {
    const ctx = {
      locale: "en",
      timeFormat: "hours24",
      timeZone: "UTC",
    } as const;
    expect(formatDateTime(at(13).toISOString(), "time", ctx)).toBe("13:00");
    expect(formatDateTime(at(13).getTime(), "time", ctx)).toBe("13:00");
  });
});

describe("formatDateTimeRange", () => {
  it("formats a time range", () => {
    const out = formatDateTimeRange(at(13), at(14), "time", {
      locale: "en",
      timeFormat: "hours24",
      timeZone: "UTC",
    });
    expect(out).toContain("13:00");
    expect(out).toContain("14:00");
  });
});

describe("formatRelativeTime", () => {
  const now = at(12);

  it("formats future hours", () => {
    expect(formatRelativeTime(at(14), "en", now)).toBe("in 2 hours");
  });

  it("formats past hours", () => {
    expect(formatRelativeTime(at(10), "en", now)).toBe("2 hours ago");
  });

  it("uses numeric auto for adjacent days (tomorrow)", () => {
    expect(
      formatRelativeTime(new Date(Date.UTC(2026, 5, 27, 12)), "en", now),
    ).toBe("tomorrow");
  });
});
