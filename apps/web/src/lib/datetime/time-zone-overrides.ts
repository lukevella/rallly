/**
 * Zones whose rules changed recently enough that engines disagree about them.
 *
 * Every Intl call reads the tz data bundled with its engine, and Rallly
 * converts on both the server (Node) and the viewer's browser. When one has
 * the new rules and the other doesn't, times shift by an hour. From `from`
 * (local wall time) onwards, each zone is swapped for a substitute that every
 * engine agrees has the zone's new fixed offset. The substitute matches the
 * old zone just before the cutoff and the corrected rules after it, so the
 * swap is seamless and harmless once every engine has caught up.
 *
 * Remove an entry once engines with the IANA fix have been out for a year.
 */
export const timeZoneOverrides = [
  {
    // Alberta: permanent UTC-6 from its 2026-03-08 spring forward (IANA 2026c).
    // The Northwest Territories followed (IANA 2026d).
    zones: [
      "America/Edmonton",
      "America/Yellowknife",
      "America/Inuvik",
      "Canada/Mountain",
    ],
    from: "2026-11-01T02:00",
    substitute: "America/Regina",
    utcOffsetMinutes: -360,
  },
  {
    // Manitoba: permanent UTC-5, announced 2026-09-17, not yet in any IANA
    // release.
    zones: ["America/Winnipeg", "Canada/Central"],
    from: "2026-11-01T02:00",
    substitute: "America/Cancun",
    utcOffsetMinutes: -300,
  },
  {
    // British Columbia: permanent UTC-7 (IANA 2026b).
    zones: ["America/Vancouver", "Canada/Pacific"],
    from: "2026-11-01T02:00",
    substitute: "America/Phoenix",
    utcOffsetMinutes: -420,
  },
] as const;

const overridesByZone = new Map(
  timeZoneOverrides.flatMap((override) => {
    // Wall-clock fields encoded as if they were UTC, for ordering only.
    const fromWallTime = Date.parse(`${override.from}:00Z`);
    const resolved = {
      substitute: override.substitute,
      fromWallTime,
      fromInstant: fromWallTime - override.utcOffsetMinutes * 60_000,
    };
    return override.zones.map((zone) => [zone as string, resolved] as const);
  }),
);

const wallTimePattern = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

function parseWallTime(value: string) {
  const match = wallTimePattern.exec(value);
  if (!match) {
    return undefined;
  }
  const [, year, month, day, hour = "0", minute = "0"] = match;
  return Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
}

/** The zone to hand to Intl or dayjs when converting this instant. */
export function resolveTimeZone(timeZone: string, instant: Date) {
  const override = overridesByZone.get(timeZone);
  return override && instant.getTime() >= override.fromInstant
    ? override.substitute
    : timeZone;
}

/**
 * The zone to use when turning a wall-clock time (YYYY-MM-DDTHH:mm, with no
 * offset) into an instant.
 */
export function resolveTimeZoneAtWallTime(timeZone: string, wallTime: string) {
  const override = overridesByZone.get(timeZone);
  const wall = override ? parseWallTime(wallTime) : undefined;
  return override && wall !== undefined && wall >= override.fromWallTime
    ? override.substitute
    : timeZone;
}
