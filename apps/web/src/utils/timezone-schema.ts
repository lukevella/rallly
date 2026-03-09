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

function resolveTimezone(tz: string): string | null {
  try {
    const resolved = Intl.DateTimeFormat(undefined, {
      timeZone: tz,
    }).resolvedOptions().timeZone;
    return normalizeLegacyIanaId(resolved);
  } catch {
    return null;
  }
}

export const timezoneSchema = z
  .string()
  .transform(resolveTimezone)
  .refine((tz) => tz && isGeographic(tz), {
    message: "Must be a valid IANA geographic timezone",
  });
