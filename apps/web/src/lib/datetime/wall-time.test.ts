import { describe, expect, it } from "vitest";
import {
  addMinutesToWallTime,
  instantToWallTime,
  wallTimeDiffInMinutes,
  wallTimeToInstant,
} from "./wall-time";

describe("wallTimeToInstant", () => {
  it("converts a wall time in a zone to an instant", () => {
    expect(wallTimeToInstant("2025-01-15T09:00", "America/New_York")).toEqual(
      new Date("2025-01-15T14:00:00Z"),
    );
    expect(
      wallTimeToInstant("2025-07-15T09:00:00", "America/New_York"),
    ).toEqual(new Date("2025-07-15T13:00:00Z"));
    expect(wallTimeToInstant("2025-01-15T09:00:00", "Asia/Kolkata")).toEqual(
      new Date("2025-01-15T03:30:00Z"),
    );
  });

  it("treats UTC as the identity", () => {
    expect(wallTimeToInstant("2025-01-15T09:00:00", "UTC")).toEqual(
      new Date("2025-01-15T09:00:00Z"),
    );
    expect(wallTimeToInstant("2025-01-15", "UTC")).toEqual(
      new Date("2025-01-15T00:00:00Z"),
    );
  });

  it("accepts a space separator and fractional seconds", () => {
    expect(
      wallTimeToInstant("2025-01-15 09:00:30.5", "America/New_York"),
    ).toEqual(new Date("2025-01-15T14:00:30.500Z"));
  });

  it("moves a time skipped by spring forward past the gap", () => {
    expect(wallTimeToInstant("2025-03-09T02:30", "America/New_York")).toEqual(
      new Date("2025-03-09T07:30:00Z"),
    );
  });

  it("resolves a time repeated by fall back to its first occurrence", () => {
    expect(wallTimeToInstant("2025-11-02T01:30", "America/New_York")).toEqual(
      new Date("2025-11-02T05:30:00Z"),
    );
  });

  it("applies the time zone overrides from the wall time", () => {
    expect(wallTimeToInstant("2026-11-05T10:00", "America/Edmonton")).toEqual(
      new Date("2026-11-05T16:00:00Z"),
    );
    expect(wallTimeToInstant("2026-11-05T10:00", "America/Winnipeg")).toEqual(
      new Date("2026-11-05T15:00:00Z"),
    );
    expect(wallTimeToInstant("2026-11-05T10:00", "America/Vancouver")).toEqual(
      new Date("2026-11-05T17:00:00Z"),
    );
    expect(wallTimeToInstant("2026-10-30T10:00", "America/Edmonton")).toEqual(
      new Date("2026-10-30T16:00:00Z"),
    );
  });

  it("returns an invalid date for unparseable input", () => {
    expect(
      Number.isNaN(wallTimeToInstant("garbage", "America/New_York").getTime()),
    ).toBe(true);
  });
});

describe("instantToWallTime", () => {
  it("reads the clocks in a zone at an instant", () => {
    expect(
      instantToWallTime(new Date("2025-01-15T14:00:00Z"), "America/New_York"),
    ).toBe("2025-01-15T09:00:00");
    expect(
      instantToWallTime(new Date("2025-01-15T03:30:00Z"), "Asia/Kolkata"),
    ).toBe("2025-01-15T09:00:00");
    expect(instantToWallTime(new Date("2025-01-15T00:00:00Z"), "UTC")).toBe(
      "2025-01-15T00:00:00",
    );
  });

  it("applies the time zone overrides from the instant", () => {
    expect(
      instantToWallTime(new Date("2026-11-05T16:00:00Z"), "America/Edmonton"),
    ).toBe("2026-11-05T10:00:00");
    expect(
      instantToWallTime(new Date("2026-11-05T15:00:00Z"), "America/Winnipeg"),
    ).toBe("2026-11-05T10:00:00");
    expect(
      instantToWallTime(new Date("2026-11-05T17:00:00Z"), "America/Vancouver"),
    ).toBe("2026-11-05T10:00:00");
  });

  it("round trips with wallTimeToInstant", () => {
    const wallTime = "2026-11-01T01:30:00";
    for (const zone of [
      "America/Edmonton",
      "America/Winnipeg",
      "America/Vancouver",
      "Europe/London",
    ]) {
      expect(instantToWallTime(wallTimeToInstant(wallTime, zone), zone)).toBe(
        wallTime,
      );
    }
  });
});

describe("wallTimeDiffInMinutes", () => {
  it("counts clock-face minutes", () => {
    expect(
      wallTimeDiffInMinutes("2025-03-09T01:00:00", "2025-03-09T04:00:00"),
    ).toBe(180);
  });
});

describe("addMinutesToWallTime", () => {
  it("moves the clock face", () => {
    expect(addMinutesToWallTime("2025-01-15T23:30:00", 60)).toBe(
      "2025-01-16T00:30:00",
    );
  });
});
