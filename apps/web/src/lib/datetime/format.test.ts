import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateParts,
  formatDateTime,
  formatDateTimeRange,
  formatRelativeTime,
} from "@/lib/datetime/format";
import type { TimeFormat } from "@/lib/datetime/types";

// Fri 26 Jun 2026, in UTC.
const at = (hour: number, minute = 0) =>
  new Date(Date.UTC(2026, 5, 26, hour, minute));

const ctx = (locale: string, timeFormat?: TimeFormat, timeZone = "UTC") => ({
  locale,
  timeFormat,
  timeZone,
});

describe("formatDateTime", () => {
  it("formats a year on its own, for a date poll's group heading", () => {
    expect(formatDateTime(at(9), { preset: "year", ...ctx("en") })).toBe(
      "2026",
    );
  });

  it("formats a weekday and day for a row inside a month group", () => {
    // The locale decides the order ("26 Fri" in en, "Fri 26" in en-GB).
    const out = formatDateTime(at(9), { preset: "weekdayDay", ...ctx("en") });
    expect(out).toContain("Fri");
    expect(out).toContain("26");
    expect(out).not.toContain("Jun");
  });

  it("formats 24-hour time", () => {
    expect(
      formatDateTime(at(13), { preset: "time", ...ctx("en", "hours24") }),
    ).toBe("13:00");
  });

  it("formats 12-hour time", () => {
    const out = formatDateTime(at(13), {
      preset: "time",
      ...ctx("en", "hours12"),
    });
    expect(out).toMatch(/\bPM\b/i);
    expect(out).not.toContain("13");
  });

  it("falls back to the locale default when no time format is set", () => {
    expect(formatDateTime(at(13), { preset: "time", ...ctx("en") })).toMatch(
      /\bPM\b/i,
    );
    expect(formatDateTime(at(13), { preset: "time", ...ctx("de") })).toContain(
      "13",
    );
  });

  it("applies the 12-hour override on a 24-hour-default locale (de)", () => {
    const out = formatDateTime(at(13), {
      preset: "time",
      ...ctx("de", "hours12"),
    });
    expect(out).not.toContain("13");
  });

  it("places the meridiem before the time for Chinese 12-hour", () => {
    expect(
      formatDateTime(at(13), { preset: "time", ...ctx("zh", "hours12") }),
    ).toBe("下午1:00");
  });

  it("preserves the locale separator under override (Finnish period)", () => {
    expect(
      formatDateTime(at(15, 30), { preset: "time", ...ctx("fi", "hours24") }),
    ).toBe("15.30");
  });

  it("produces different output for hours12 vs hours24 (override applied)", () => {
    expect(
      formatDateTime(at(13), { preset: "time", ...ctx("en", "hours12") }),
    ).not.toBe(
      formatDateTime(at(13), { preset: "time", ...ctx("en", "hours24") }),
    );
  });

  it("converts to the given timezone", () => {
    // 13:00 UTC = 09:00 America/New_York (EDT) in June.
    expect(
      formatDateTime(at(13), {
        preset: "time",
        ...ctx("en", "hours24", "America/New_York"),
      }),
    ).toBe("09:00");
  });

  it("formats a weekday", () => {
    expect(
      formatDateTime(at(13), { preset: "weekday", ...ctx("en", "hours24") }),
    ).toBe("Friday");
  });

  it("formats a datetime with both date and time parts", () => {
    const out = formatDateTime(at(13), {
      preset: "datetime",
      ...ctx("en", "hours24"),
    });
    expect(out).toContain("2026");
    expect(out).toContain("13:00");
  });

  it("applies the timezone to the datetime preset", () => {
    // 13:00 UTC = 09:00 America/New_York; the date+time preset must honor it.
    const out = formatDateTime(at(13), {
      preset: "datetime",
      ...ctx("en", "hours24", "America/New_York"),
    });
    expect(out).toContain("09:00");
    expect(out).not.toContain("13:00");
  });

  it("date preset omits the time", () => {
    const out = formatDateTime(at(13), {
      preset: "date",
      ...ctx("en", "hours24"),
    });
    expect(out).toContain("2026");
    expect(out).not.toContain("13:00");
  });

  it("appends the timezone name when showTimeZone is set", () => {
    const out = formatDateTime(at(13), {
      preset: "time",
      ...ctx("en", "hours24", "America/New_York"),
      showTimeZone: true,
    });
    expect(out).toContain("EDT");
  });

  it("accepts timestamps", () => {
    expect(
      formatDateTime(at(13).getTime(), {
        preset: "time",
        ...ctx("en", "hours24"),
      }),
    ).toBe("13:00");
  });
});

describe("formatDateTimeRange", () => {
  it("formats a time range", () => {
    const out = formatDateTimeRange(at(13), at(14), {
      preset: "time",
      ...ctx("en", "hours24"),
    });
    expect(out).toContain("13:00");
    expect(out).toContain("14:00");
  });
});

describe("formatDate", () => {
  it("formats a UTC-midnight value as the stored calendar date", () => {
    // Midnight UTC is the previous day in every zone west of UTC; formatDate
    // must ignore the viewer's zone entirely.
    const utcMidnight = new Date(Date.UTC(2026, 5, 26));
    expect(formatDate(utcMidnight, { locale: "en" })).toBe("June 26, 2026");
  });

  it("supports date presets", () => {
    const utcMidnight = new Date(Date.UTC(2026, 5, 26));
    expect(formatDate(utcMidnight, { preset: "weekday", locale: "en" })).toBe(
      "Friday",
    );
  });
});

describe("formatRelativeTime", () => {
  // Relative to the real current time, so derive the input from `Date.now()` to
  // keep these deterministic.
  const twoHoursAgo = () => new Date(Date.now() - 2 * 60 * 60 * 1000);

  it("formats relative time", () => {
    expect(formatRelativeTime(twoHoursAgo(), "en")).toBe("2 hours ago");
  });

  it("localizes relative time", () => {
    expect(formatRelativeTime(twoHoursAgo(), "de")).toBe("vor 2 Stunden");
  });
});

// Alberta, Manitoba and British Columbia stopped falling back on 2026-11-01.
// These must hold on engines whose tz data predates the change.
describe("provinces that stopped changing clocks", () => {
  const time = (instant: string, timeZone: string) =>
    formatDateTime(new Date(instant), {
      preset: "time",
      ...ctx("en", "hours24", timeZone),
    });

  it("formats Alberta times at UTC-6 after the cutoff", () => {
    expect(time("2026-11-05T16:00:00Z", "America/Edmonton")).toBe("10:00");
  });

  it("formats Manitoba times at UTC-5 after the cutoff", () => {
    expect(time("2026-11-05T15:00:00Z", "America/Winnipeg")).toBe("10:00");
  });

  it("formats British Columbia times at UTC-7 after the cutoff", () => {
    expect(time("2026-11-05T17:00:00Z", "America/Vancouver")).toBe("10:00");
  });

  it("formats ranges after the cutoff", () => {
    const out = formatDateTimeRange(
      new Date("2026-11-05T16:00:00Z"),
      new Date("2026-11-05T17:00:00Z"),
      { preset: "time", ...ctx("en", "hours24", "America/Edmonton") },
    );
    expect(out).toContain("10:00");
    expect(out).toContain("11:00");
  });

  it("formats a range that crosses the cutoff", () => {
    // 01:30 MDT to 02:30 at UTC-6; the old rules put the end at 01:30 MST.
    const out = formatDateTimeRange(
      new Date("2026-11-01T07:30:00Z"),
      new Date("2026-11-01T08:30:00Z"),
      { preset: "time", ...ctx("en", "hours24", "America/Edmonton") },
    );
    expect(out).toContain("01:30");
    expect(out).toContain("02:30");
  });

  it("formats a range whose endpoints need different offsets", () => {
    // 10:00 at UTC-7 in January, 10:00 at UTC-6 in November.
    const out = formatDateTimeRange(
      new Date("2026-01-15T17:00:00Z"),
      new Date("2026-11-05T16:00:00Z"),
      { preset: "datetime", ...ctx("en", "hours24", "America/Edmonton") },
    );
    expect(out).toContain("Jan 15, 2026, 10:00");
    expect(out).toContain("Nov 5, 2026, 10:00");
  });

  it("formats date parts on the right calendar day after the cutoff", () => {
    expect(
      formatDateParts(new Date("2026-11-06T06:30:00Z"), {
        locale: "en",
        timeZone: "America/Edmonton",
      }).day,
    ).toBe("6");
  });

  it("leaves times before the cutoff unchanged", () => {
    expect(time("2026-07-01T16:00:00Z", "America/Edmonton")).toBe("10:00");
  });
});
