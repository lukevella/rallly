import {
  resolveTimeZone,
  resolveTimeZoneAtWallTime,
} from "@/lib/datetime/time-zone-overrides";

const wallTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3})\d*)?)?)?$/;

/** Wall-clock fields encoded as if they were UTC, or NaN when unparseable. */
const parseWallTime = (wallTime: string) => {
  const match = wallTimePattern.exec(wallTime);
  if (!match) {
    return Number.NaN;
  }
  const [, year, month, day, hour = "0", minute = "0", second = "0", ms = "0"] =
    match;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
    Number(ms.padEnd(3, "0")),
  );
};

const formatters = new Map<string, Intl.DateTimeFormat>();

const getFormatter = (timeZone: string) => {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
};

/** Wall-clock fields of `instant` in `timeZone`, encoded as if they were UTC. */
const wallTimeAt = (instant: number, timeZone: string) => {
  const parts = getFormatter(timeZone).formatToParts(instant);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return (
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    ) +
    (((instant % 1000) + 1000) % 1000)
  );
};

const offsetAt = (instant: number, timeZone: string) =>
  wallTimeAt(instant, timeZone) - instant;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The instant at which clocks in `timeZone` read `wallTime`
 * (YYYY-MM-DD, optionally followed by THH:mm[:ss], with no offset).
 *
 * A time skipped by a forward transition resolves as if the clocks had not
 * yet moved (02:30 on a spring-forward day becomes 03:30); a time repeated by
 * a backward transition resolves to its first occurrence.
 */
export function wallTimeToInstant(wallTime: string, timeZone: string) {
  const wall = parseWallTime(wallTime);
  if (Number.isNaN(wall)) {
    return new Date(Number.NaN);
  }
  const zone = resolveTimeZoneAtWallTime(timeZone, wallTime);
  const offsetBefore = offsetAt(wall - DAY_MS, zone);
  const offsetAfter = offsetAt(wall + DAY_MS, zone);
  const candidates = [wall - offsetBefore, wall - offsetAfter].filter(
    (instant) => wallTimeAt(instant, zone) === wall,
  );
  return new Date(
    candidates.length > 0 ? Math.min(...candidates) : wall - offsetBefore,
  );
}

/**
 * What clocks in `timeZone` read at `instant`, as YYYY-MM-DDTHH:mm:ss with no
 * offset.
 */
export function instantToWallTime(instant: Date, timeZone: string) {
  const wall = wallTimeAt(
    instant.getTime(),
    resolveTimeZone(timeZone, instant),
  );
  return new Date(wall).toISOString().slice(0, 19);
}

/** Minutes from one wall-clock time to another, ignoring any zone. */
export function wallTimeDiffInMinutes(from: string, to: string) {
  return (parseWallTime(to) - parseWallTime(from)) / 60_000;
}

/** `wallTime` moved by `minutes` on the clock face, ignoring any zone. */
export function addMinutesToWallTime(wallTime: string, minutes: number) {
  return new Date(parseWallTime(wallTime) + minutes * 60_000)
    .toISOString()
    .slice(0, 19);
}
