import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatDateTimeRange,
  formatRelativeTime,
  formatSpeechTime,
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

describe("formatSpeechTime", () => {
  // The meridiem separator varies by ICU version (regular vs narrow no-break
  // space), so normalize whitespace before asserting rather than hardcode it.
  const speech = (...args: Parameters<typeof formatSpeechTime>) =>
    formatSpeechTime(...args).replace(/\s+/g, " ");

  it("drops the zero minute for 12-hour time", () => {
    expect(speech(at(13), ctx("en", "hours12"))).toBe("1 PM");
  });

  it("keeps a non-zero minute", () => {
    expect(speech(at(13, 30), ctx("en", "hours12"))).toBe("1:30 PM");
  });

  it("drops the zero minute for 24-hour time, leaving just the hour", () => {
    expect(speech(at(13), ctx("en", "hours24"))).toBe("13");
  });

  it("keeps a non-zero minute for 24-hour time", () => {
    expect(speech(at(13, 30), ctx("en", "hours24"))).toBe("13:30");
  });

  it("preserves meridiem-first order without inserting a space (zh)", () => {
    expect(speech(at(13), ctx("zh", "hours12"))).toBe("下午1");
  });

  it("honors the timezone", () => {
    // 13:00 UTC = 09:00 America/New_York (EDT) in June.
    expect(speech(at(13), ctx("en", "hours24", "America/New_York"))).toBe("09");
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
