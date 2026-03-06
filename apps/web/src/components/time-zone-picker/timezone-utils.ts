import type { TimezoneEntry } from "./timezone-data";
import { timezoneEntries } from "./timezone-data";

export interface TimezoneEntryWithOffset extends TimezoneEntry {
  offsetMinutes: number;
  offsetLabel: string;
}

function getOffsetMinutes(iana: string): number {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: iana,
    timeZoneName: "shortOffset",
  }).formatToParts(now);

  const tzPart = parts.find((p) => p.type === "timeZoneName")?.value ?? "";

  // tzPart is like "GMT", "GMT+5:30", "GMT-8"
  if (tzPart === "GMT") return 0;

  const match = tzPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
  if (!match) return 0;

  const sign = match[1] === "+" ? 1 : -1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = Number.parseInt(match[3] ?? "0", 10);
  return sign * (hours * 60 + minutes);
}

function formatOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(offsetMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${sign}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

let cached: TimezoneEntryWithOffset[] | null = null;
let cachedAt = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export function getTimezoneEntriesWithOffset(): TimezoneEntryWithOffset[] {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL) return cached;

  const entries = timezoneEntries.map((entry) => {
    const offsetMinutes = getOffsetMinutes(entry.id);
    return {
      ...entry,
      offsetMinutes,
      offsetLabel: formatOffset(offsetMinutes),
    };
  });

  entries.sort((a, b) => a.offsetMinutes - b.offsetMinutes);

  cached = entries;
  cachedAt = now;
  return entries;
}
