import { describe, expect, it } from "vitest";
import {
  calendarDateToUTCMidnight,
  getCalendarDate,
  normalizeTimeZone,
} from "./utils";

describe("normalizeTimeZone", () => {
  it("returns a valid IANA zone unchanged", () => {
    expect(normalizeTimeZone("Europe/Malta")).toBe("Europe/Malta");
    expect(normalizeTimeZone("UTC")).toBe("UTC");
  });

  it("treats empty and nullish values as unset", () => {
    expect(normalizeTimeZone("")).toBeUndefined();
    expect(normalizeTimeZone(null)).toBeUndefined();
    expect(normalizeTimeZone(undefined)).toBeUndefined();
  });

  it("treats invalid zone names as unset instead of throwing", () => {
    expect(normalizeTimeZone("Not/AZone")).toBeUndefined();
    expect(normalizeTimeZone("garbage")).toBeUndefined();
  });
});

describe("getCalendarDate", () => {
  // 2025-07-02T01:00:00Z = 3pm July 1 in Honolulu (UTC-10)
  const instant = new Date("2025-07-02T01:00:00Z");

  it("returns the previous calendar date west of UTC", () => {
    expect(getCalendarDate(instant, "Pacific/Honolulu")).toBe("2025-07-01");
  });

  it("returns the UTC calendar date in UTC", () => {
    expect(getCalendarDate(instant, "UTC")).toBe("2025-07-02");
  });

  it("returns the next calendar date east of UTC", () => {
    // 2025-07-01T20:00:00Z = 5am July 2 in Tokyo (UTC+9)
    expect(
      getCalendarDate(new Date("2025-07-01T20:00:00Z"), "Asia/Tokyo"),
    ).toBe("2025-07-02");
  });
});

describe("calendarDateToUTCMidnight", () => {
  it("encodes a calendar date as UTC midnight", () => {
    expect(calendarDateToUTCMidnight("2025-07-01").toISOString()).toBe(
      "2025-07-01T00:00:00.000Z",
    );
  });
});
