import type { DateInput } from "@/lib/datetime/format";
import type { TimeFormat } from "@/lib/datetime/schema";

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
 * The calendar date (YYYY-MM-DD) at the given instant in the given zone.
 * en-CA is the locale whose date format is ISO 8601.
 */
export function getCalendarDate(now: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * Encodes a calendar date the same way allDay event dates are stored in the
 * database: as UTC midnight of that date.
 */
export function calendarDateToUTCMidnight(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
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
