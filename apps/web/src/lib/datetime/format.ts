import type { TimeFormat } from "@rallly/database";

export type DateInput = Date | string | number;

export type DatePreset = "date" | "dateLong" | "weekday";

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
    case "weekday":
      return { weekday: "long" };
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
