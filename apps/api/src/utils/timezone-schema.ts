import { z } from "zod";

// Override runtime canonicalization when ICU data lags behind IANA updates.
const ianaOverrides: Record<string, string> = {
  "Europe/Kiev": "Europe/Kyiv",
};

export function normalizeLegacyIanaId(id: string): string {
  return ianaOverrides[id] ?? id;
}

const fixedOffsetPrefixes = ["etc/", "gmt", "utc"];

function isGeographic(timeZone: string) {
  const lower = timeZone.toLowerCase();
  return !fixedOffsetPrefixes.some((prefix) => lower.startsWith(prefix));
}

/**
 * Resolve timezone to its canonical IANA ID via the runtime,
 * then apply manual overrides for cases where the runtime is outdated.
 * Returns the canonical ID or null if the timezone is invalid.
 */
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

export const timezoneSchema = z.string().transform((tz, ctx) => {
  const resolved = resolveTimezone(tz);
  if (resolved === null) {
    ctx.issues.push({
      code: "custom",
      message: "Must be a valid IANA timezone",
      input: tz,
    });
    return z.NEVER;
  }

  if (!isGeographic(resolved)) {
    ctx.issues.push({
      code: "custom",
      message: "Must be a geographic timezone",
      input: tz,
    });
    return z.NEVER;
  }

  return resolved;
});
