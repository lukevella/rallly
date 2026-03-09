import { z } from "zod";

// Normalize legacy IANA IDs to their modern canonical equivalents.
// Runtimes may still resolve to deprecated IDs (e.g. "Europe/Kiev").
const ianaRenames: Record<string, string> = {
  "Europe/Kiev": "Europe/Kyiv",
};

export function normalizeLegacyIanaId(id: string): string {
  return ianaRenames[id] ?? id;
}

const fixedOffsetPrefixes = ["etc/", "gmt", "utc"];

function isGeographic(timeZone: string) {
  const lower = timeZone.toLowerCase();
  return !fixedOffsetPrefixes.some((prefix) => lower.startsWith(prefix));
}

function validateTimezone(tz: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, {
      timeZone: tz,
    }).resolvedOptions().timeZone;
    return true;
  } catch {
    return false;
  }
}

export const timezoneSchema = z
  .string()
  .refine(validateTimezone, {
    message: "Must be a valid IANA timezone",
  })
  .refine(isGeographic, {
    message: "Must be a geographic timezone",
  })
  .transform(normalizeLegacyIanaId);
