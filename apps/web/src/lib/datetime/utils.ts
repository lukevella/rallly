import type { TimeFormat } from "@rallly/database";
import type { DateInput } from "@/lib/datetime/format";

function toDate(value: DateInput) {
  return value instanceof Date ? value : new Date(value);
}

export function toISO(value: DateInput) {
  return toDate(value).toISOString();
}

export function toISODate(value: DateInput) {
  return toDate(value).toISOString().slice(0, 10);
}

/**
 * Returns the given zone if it's a valid IANA identifier, otherwise
 * undefined. Guards against empty strings and corrupt stored values, which
 * would make Intl.DateTimeFormat throw.
 */
export function normalizeTimeZone(timeZone: string | undefined | null) {
  if (!timeZone) {
    return undefined;
  }
  try {
    new Intl.DateTimeFormat(undefined, { timeZone });
    return timeZone;
  } catch {
    return undefined;
  }
}

/** Narrows a stored value to a TimeFormat; anything else means "unset". */
export function normalizeTimeFormat(
  value: string | undefined | null,
): TimeFormat | undefined {
  return value === "hours12" || value === "hours24" ? value : undefined;
}
