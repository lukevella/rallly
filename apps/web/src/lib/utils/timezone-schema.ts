import * as z from "zod";

// CLDR/ICU keeps pre-2008 tzdb IDs canonical for stability, so the runtime
// reports (and `Intl.supportedValuesOf` lists) the outdated spellings. Map them
// back to the modern tzdb-canonical names for display.
const ianaOverrides: Record<string, string> = {
  "America/Buenos_Aires": "America/Argentina/Buenos_Aires",
  "Asia/Calcutta": "Asia/Kolkata",
  "Asia/Katmandu": "Asia/Kathmandu",
  "Asia/Rangoon": "Asia/Yangon",
  "Asia/Saigon": "Asia/Ho_Chi_Minh",
  "Europe/Kiev": "Europe/Kyiv",
};

export function normalizeLegacyIanaId(id: string): string {
  return ianaOverrides[id] ?? id;
}

const legacyIdsByModernId = Object.entries(ianaOverrides).reduce<
  Record<string, string[]>
>((acc, [legacy, modern]) => {
  acc[modern] = [...(acc[modern] ?? []), legacy];
  return acc;
}, {});

/**
 * Every spelling of a zone we know about — modern and legacy — for the given
 * ID, whichever spelling it arrives in. Used for search, so a query matches an
 * alias no matter which form the runtime happens to list.
 */
export function getIanaIdAliases(id: string) {
  const modern = normalizeLegacyIanaId(id);
  return Array.from(
    new Set([id, modern, ...(legacyIdsByModernId[modern] ?? [])]),
  );
}

/**
 * Fold an IANA ID to whatever spelling this runtime treats as canonical.
 *
 * The inverse of `normalizeLegacyIanaId`: that maps legacy IDs to modern names
 * for display, this maps either spelling to the runtime's own. Comparing IDs by
 * this form matches a curated `Asia/Kolkata` against a runtime `Asia/Calcutta`
 * without depending on the override map covering that pair, so engines whose
 * affected set differs are handled too. Unknown IDs are returned unchanged.
 */
export function toRuntimeCanonicalIanaId(id: string): string {
  try {
    return Intl.DateTimeFormat(undefined, { timeZone: id }).resolvedOptions()
      .timeZone;
  } catch {
    return id;
  }
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
