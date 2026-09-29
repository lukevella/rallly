import { describe, expect, it } from "vitest";
import {
  resolveTimeZone,
  resolveTimeZoneAtWallTime,
  timeZoneOverrides,
} from "./time-zone-overrides";

const offsetMinutesAt = (timeZone: string, instant: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const wall = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
  );
  return (wall - instant.getTime()) / 60_000;
};

describe("resolveTimeZone", () => {
  it("substitutes Alberta's zone after its last fall back", () => {
    expect(
      resolveTimeZone("America/Edmonton", new Date("2026-11-05T16:00:00Z")),
    ).toBe("America/Regina");
  });

  it("substitutes Manitoba's zone after its last fall back", () => {
    expect(
      resolveTimeZone("America/Winnipeg", new Date("2026-11-05T15:00:00Z")),
    ).toBe("America/Cancun");
  });

  it("substitutes British Columbia's zone after its last fall back", () => {
    expect(
      resolveTimeZone("America/Vancouver", new Date("2026-11-05T17:00:00Z")),
    ).toBe("America/Phoenix");
  });

  it("keeps the zone before the cutoff", () => {
    expect(
      resolveTimeZone("America/Edmonton", new Date("2026-11-01T07:59:00Z")),
    ).toBe("America/Edmonton");
  });

  it("covers legacy aliases", () => {
    const instant = new Date("2026-11-05T16:00:00Z");
    expect(resolveTimeZone("Canada/Mountain", instant)).toBe("America/Regina");
    expect(resolveTimeZone("Canada/Central", instant)).toBe("America/Cancun");
    expect(resolveTimeZone("Canada/Pacific", instant)).toBe("America/Phoenix");
  });

  it("leaves other zones alone", () => {
    expect(
      resolveTimeZone("America/Denver", new Date("2026-11-05T16:00:00Z")),
    ).toBe("America/Denver");
  });
});

describe("resolveTimeZoneAtWallTime", () => {
  it("substitutes wall times from the cutoff onwards", () => {
    expect(
      resolveTimeZoneAtWallTime("America/Edmonton", "2026-11-01T02:00:00"),
    ).toBe("America/Regina");
    expect(
      resolveTimeZoneAtWallTime("America/Edmonton", "2026-11-05T10:00"),
    ).toBe("America/Regina");
    expect(
      resolveTimeZoneAtWallTime("America/Edmonton", "2026-11-05 10:00:00"),
    ).toBe("America/Regina");
  });

  it("keeps the zone for wall times before the cutoff", () => {
    expect(
      resolveTimeZoneAtWallTime("America/Edmonton", "2026-11-01T01:59:00"),
    ).toBe("America/Edmonton");
    expect(resolveTimeZoneAtWallTime("America/Edmonton", "2026-11-01")).toBe(
      "America/Edmonton",
    );
  });

  it("leaves unparseable values and other zones alone", () => {
    expect(resolveTimeZoneAtWallTime("America/Edmonton", "garbage")).toBe(
      "America/Edmonton",
    );
    expect(
      resolveTimeZoneAtWallTime("America/Denver", "2026-11-05T10:00:00"),
    ).toBe("America/Denver");
  });
});

describe.each(timeZoneOverrides)("override for $zones.0", (override) => {
  it("uses a substitute with the declared fixed offset", () => {
    for (const instant of ["2026-12-15T12:00:00Z", "2027-07-15T12:00:00Z"]) {
      expect(offsetMinutesAt(override.substitute, new Date(instant))).toBe(
        override.utcOffsetMinutes,
      );
    }
  });

  it("matches the original zone just before the cutoff", () => {
    const justBefore = new Date(
      resolveCutoff(override.from, override.utcOffsetMinutes) - 60_000,
    );
    for (const zone of override.zones) {
      expect(offsetMinutesAt(zone, justBefore)).toBe(override.utcOffsetMinutes);
    }
  });
});

function resolveCutoff(from: string, utcOffsetMinutes: number) {
  return Date.parse(`${from}:00Z`) - utcOffsetMinutes * 60_000;
}
