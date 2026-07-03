import { describe, expect, it } from "vitest";
import { getLocaleDefaults, getWeekdayNames } from "@/lib/datetime/locales";

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
      { day: 0, label: "Sunday" },
      { day: 1, label: "Monday" },
      { day: 2, label: "Tuesday" },
      { day: 3, label: "Wednesday" },
      { day: 4, label: "Thursday" },
      { day: 5, label: "Friday" },
      { day: 6, label: "Saturday" },
    ]);
  });

  it("starts with Monday for de, keeping canonical day numbers", () => {
    const weekdays = getWeekdayNames("de");
    expect(weekdays[0]).toEqual({ day: 1, label: "Montag" });
    expect(weekdays[6]).toEqual({ day: 0, label: "Sonntag" });
  });
});
