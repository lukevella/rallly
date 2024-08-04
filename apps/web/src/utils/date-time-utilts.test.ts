import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { describe, expect, it } from "vitest";

import { supportedTimeZones } from "@/utils/supported-time-zones";

import { normalizeTimeZone } from "./date-time-utils";

dayjs.extend(utc);
dayjs.extend(timezone);

describe("Normalize Time Zone", () => {
  it("should return same timezone when given a geographic timezone", () => {
    const browserTimeZone = normalizeTimeZone("Europe/London");

    // Assert that the browser time zone is one of the supported time zones
    expect(browserTimeZone).toBe("Europe/London");
  });
  it("should return a supported timezone when given a fixed offset timezone", () => {
    const browserTimeZone = normalizeTimeZone("Etc/GMT-1");

    // Assert that the browser time zone is one of the supported time zones
    expect(supportedTimeZones.includes(browserTimeZone)).toBe(true);
  });
  it("should return a supported timezone when given GMT", () => {
    const browserTimeZone = normalizeTimeZone("GMT");

    // Assert that the browser time zone is one of the supported time zones
    expect(supportedTimeZones.includes(browserTimeZone)).toBe(true);
  });
  it("should return a supported timezone when given UTC", () => {
    const browserTimeZone = normalizeTimeZone("UTC");

    // Assert that the browser time zone is one of the supported time zones
    expect(supportedTimeZones.includes(browserTimeZone)).toBe(true);
  });

  it("should return a valid timezone in the same continent when not recognized", () => {
    const browserTimeZone = normalizeTimeZone("Asia/Kolkata");

    expect(browserTimeZone).toBe("Asia/Calcutta");
  });
});
