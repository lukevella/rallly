import { describe, expect, it } from "vitest";
import {
  getLocaleDefaults,
  getWeekdayNames,
  getWeekStartFromLanguageTags,
} from "@/lib/datetime/locales";

// Tripwire: these lock the CLDR-derived defaults so an ICU/Node upgrade that
// shifts one fails loudly.
describe("getLocaleDefaults", () => {
  it("uses a 12-hour clock and Sunday week start for en (US)", () => {
    expect(getLocaleDefaults("en")).toEqual({
      timeFormat: "hours12",
      weekStart: 0,
    });
  });

  it("uses a 24-hour clock and Monday week start for en-GB", () => {
    expect(getLocaleDefaults("en-GB")).toEqual({
      timeFormat: "hours24",
      weekStart: 1,
    });
  });

  it("uses a 24-hour clock and Monday week start for de", () => {
    expect(getLocaleDefaults("de")).toEqual({
      timeFormat: "hours24",
      weekStart: 1,
    });
  });

  it("trusts CLDR's Sunday week start for Portugal (pt)", () => {
    expect(getLocaleDefaults("pt")).toEqual({
      timeFormat: "hours24",
      weekStart: 0,
    });
  });
});

// Order follows the locale's default week start; `day` stays canonical
// (0=Sunday .. 6=Saturday) regardless of position.
describe("getWeekdayNames", () => {
  it("starts with Sunday for en", () => {
    expect(getWeekdayNames("en")).toEqual([
      { day: 0, label: "Sunday", short: "Sun" },
      { day: 1, label: "Monday", short: "Mon" },
      { day: 2, label: "Tuesday", short: "Tue" },
      { day: 3, label: "Wednesday", short: "Wed" },
      { day: 4, label: "Thursday", short: "Thu" },
      { day: 5, label: "Friday", short: "Fri" },
      { day: 6, label: "Saturday", short: "Sat" },
    ]);
  });

  it("starts with Monday for de, keeping canonical day numbers", () => {
    const weekdays = getWeekdayNames("de");
    expect(weekdays[0]).toEqual({ day: 1, label: "Montag", short: "Mo" });
    expect(weekdays[6]).toEqual({ day: 0, label: "Sonntag", short: "So" });
  });

  it("starts with the given week start", () => {
    const weekdays = getWeekdayNames("en", 1);
    expect(weekdays[0]).toEqual({ day: 1, label: "Monday", short: "Mon" });
    expect(weekdays[6]).toEqual({ day: 0, label: "Sunday", short: "Sun" });
  });

  it("localizes the abbreviated names", () => {
    expect(getWeekdayNames("fr").map((day) => day.short)).toContain("lun.");
    expect(getWeekdayNames("es").map((day) => day.short)).toContain("lun");
  });
});

// The browser's region decides the week start, not the UI language.
describe("getWeekStartFromLanguageTags", () => {
  it("uses Monday for en-GB and en-SE", () => {
    expect(getWeekStartFromLanguageTags(["en-GB"])).toBe(1);
    expect(getWeekStartFromLanguageTags(["en-SE"])).toBe(1);
  });

  it("uses Sunday for en-US", () => {
    expect(getWeekStartFromLanguageTags(["en-US"])).toBe(0);
  });

  it("skips tags that Intl rejects", () => {
    expect(getWeekStartFromLanguageTags(["not_a_tag", "sv"])).toBe(1);
  });

  it("returns undefined when no tag is usable", () => {
    expect(getWeekStartFromLanguageTags([])).toBeUndefined();
    expect(getWeekStartFromLanguageTags(["not_a_tag"])).toBeUndefined();
  });
});
