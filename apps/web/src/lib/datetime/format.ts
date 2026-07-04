import type { TimeFormat } from "@rallly/database";

export type DateInput = Date | string | number;

export type DatePreset =
  | "date"
  | "dateLong"
  | "dateFull"
  | "weekday"
  | "weekdayMonthDay"
  | "monthYear"
  | "monthDay";

export type DateTimePreset = DatePreset | "time" | "datetime";

export type FormatDateTimeOptions = {
  preset?: DateTimePreset;
  locale: string;
  timeFormat?: TimeFormat;
  timeZone?: string;
  showTimeZone?: boolean;
};

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function getCachedIntlDateFormatter({
  preset = "datetime",
  locale,
  timeFormat,
  timeZone,
  showTimeZone,
}: FormatDateTimeOptions) {
  const options = {
    ...presetOptions(preset, timeFormat),
    // An empty string is an invalid IANA zone and throws; treat it as "unset".
    timeZone: timeZone || undefined,
    timeZoneName: showTimeZone ? ("short" as const) : undefined,
  };
  const key = `${locale}|${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, f);
  }
  return f;
}

function presetOptions(
  preset: DateTimePreset,
  timeFormat?: TimeFormat,
): Intl.DateTimeFormatOptions {
  // Leave hour12 undefined when there's no preference so the locale decides.
  const hour12 = timeFormat ? timeFormat === "hours12" : undefined;
  switch (preset) {
    case "time":
      return {
        hour: hour12 === false ? "2-digit" : "numeric",
        minute: "2-digit",
        hour12,
      };
    case "date":
      return {
        year: "numeric",
        month: "short",
        day: "numeric",
      };
    case "dateLong":
      return {
        year: "numeric",
        month: "long",
        day: "numeric",
      };
    case "dateFull":
      return {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      };
    case "weekday":
      return { weekday: "long" };
    case "weekdayMonthDay":
      return { weekday: "long", month: "long", day: "numeric" };
    case "monthYear":
      return { month: "long", year: "numeric" };
    case "monthDay":
      return { month: "long", day: "numeric" };
    case "datetime":
      return {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: hour12 === false ? "2-digit" : "numeric",
        minute: "2-digit",
        hour12,
      };
  }
}

export function formatDateTime(
  value: DateInput,
  options: FormatDateTimeOptions,
): string {
  return getCachedIntlDateFormatter(options).format(toDate(value));
}

export function formatDateTimeRange(
  start: DateInput,
  end: DateInput,
  options: FormatDateTimeOptions,
): string {
  return getCachedIntlDateFormatter(options).formatRange(
    toDate(start),
    toDate(end),
  );
}

// All-day values are stored as UTC midnight, so they always format in UTC.
export function formatDate(
  value: DateInput,
  options: { preset?: DatePreset; locale: string },
): string {
  return formatDateTime(value, {
    preset: options.preset ?? "dateLong",
    locale: options.locale,
    timeZone: "UTC",
  });
}

export type DateParts = {
  weekday: string;
  day: string;
  month: string;
  year: string;
};

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Decomposed short parts for chip-style UI (dow/day/month/year columns).
 * One formatToParts call keeps the parts consistent with each other instead
 * of running parallel formatters.
 */
export function formatDateParts(
  value: DateInput,
  options: { locale: string; timeZone?: string },
): DateParts {
  const key = `${options.locale}|${options.timeZone ?? ""}`;
  let f = partsFormatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(options.locale, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
      // An empty string is an invalid IANA zone and throws; treat it as "unset".
      timeZone: options.timeZone || undefined,
    });
    partsFormatters.set(key, f);
  }

  const parts: DateParts = { weekday: "", day: "", month: "", year: "" };
  for (const part of f.formatToParts(toDate(value))) {
    if (part.type in parts) {
      parts[part.type as keyof DateParts] = part.value;
    }
  }
  return parts;
}

type DurationFormatCtor = new (
  locale: string | undefined,
  options: { style: "narrow" },
) => { format(duration: { hours?: number; minutes?: number }): string };

const durationFormatters = new Map<string, InstanceType<DurationFormatCtor>>();

export function formatDuration(minutes: number, locale: string): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const DurationFormat = (Intl as { DurationFormat?: DurationFormatCtor })
    .DurationFormat;
  if (DurationFormat) {
    let formatter = durationFormatters.get(locale);
    if (!formatter) {
      formatter = new DurationFormat(locale, { style: "narrow" });
      durationFormatters.set(locale, formatter);
    }
    return formatter.format({ hours, minutes: mins });
  }
  if (hours && mins) {
    return `${hours}h ${mins}m`;
  }
  if (hours) {
    return `${hours}h`;
  }
  return `${mins}m`;
}

const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>();

// Largest-first; each entry is how many of the unit make up the next one.
const DIVISIONS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 60],
  ["minute", 60],
  ["hour", 24],
  ["day", 7],
  ["week", 4.34524],
  ["month", 12],
  ["year", Number.POSITIVE_INFINITY],
];

export function formatRelativeTime(value: DateInput, locale: string): string {
  let rtf = relativeFormatters.get(locale);
  if (!rtf) {
    rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    relativeFormatters.set(locale, rtf);
  }

  let amount = (toDate(value).getTime() - Date.now()) / 1000;
  for (const [unit, perNext] of DIVISIONS) {
    if (Math.abs(amount) < perNext) {
      return rtf.format(Math.round(amount), unit);
    }
    amount /= perNext;
  }
  return rtf.format(Math.round(amount), "year");
}
