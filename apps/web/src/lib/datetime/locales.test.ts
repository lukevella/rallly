import { describe, expect, it } from "vitest";
import { getLocaleDefaults } from "@/lib/datetime/locales";

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
