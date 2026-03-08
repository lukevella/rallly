import { z } from "zod";

const fixedOffsetPrefixes = ["etc/", "gmt", "utc"];

// Runtimes may still resolve to legacy IANA IDs that have been renamed.
// Map them to their modern canonical equivalents.
const ianaRenames: Record<string, string> = {
  "Europe/Kiev": "Europe/Kyiv",
};

function isGeographic(timeZone: string) {
  const lower = timeZone.toLowerCase();
  return !fixedOffsetPrefixes.some((prefix) => lower.startsWith(prefix));
}

function resolveTimezone(tz: string): string | null {
  try {
    const resolved = Intl.DateTimeFormat(undefined, {
      timeZone: tz,
    }).resolvedOptions().timeZone;
    return resolved;
  } catch {
    return null;
  }
}

export const timezoneSchema = z.string().transform((tz, ctx) => {
  const resolved = resolveTimezone(tz);
  if (!resolved || !isGeographic(resolved)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Must be a valid IANA geographic timezone",
    });
    return z.NEVER;
  }
  return ianaRenames[resolved] ?? resolved;
});
