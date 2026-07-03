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

// Index 0 must be Sunday regardless of the locale's own week start, to match
// the weekStart 0-6 contract.
describe("getWeekdayNames", () => {
  it("returns Sunday-first names for en", () => {
    expect(getWeekdayNames("en")).toEqual([
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]);
  });

  it("stays Sunday-first for a Monday-start locale (de)", () => {
    const names = getWeekdayNames("de");
    expect(names[0]).toBe("Sonntag");
    expect(names[6]).toBe("Samstag");
  });
});
