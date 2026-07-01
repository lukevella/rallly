import type { TimeFormat } from "@rallly/database";

export type DateInput = Date | string | number;

export type DateTimePreset =
  | "time"
  | "date"
  | "dateLong"
  | "weekday"
  | "datetime";

type FormatContext = {
  locale: string;
  timeFormat: TimeFormat;
  timeZone?: string;
};

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function getCachedIntlDateFormatter(
  preset: DateTimePreset,
  ctx: FormatContext,
) {
  const options = {
    ...presetOptions(preset, {
      timeFormat: ctx.timeFormat,
    }),
    // An empty string is an invalid IANA zone and throws; treat it as "unset".
    timeZone: ctx.timeZone || undefined,
  };
  const key = `${ctx.locale}|${JSON.stringify(options)}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.DateTimeFormat(ctx.locale, options);
    formatters.set(key, f);
  }
  return f;
}

function presetOptions(
  preset: DateTimePreset,
  options: {
    timeFormat: TimeFormat;
  },
): Intl.DateTimeFormatOptions {
  const hour12 = options.timeFormat === "hours12";
  switch (preset) {
    case "time":
      return {
        hour: hour12 ? "numeric" : "2-digit",
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
        hour: hour12 ? "numeric" : "2-digit",
        minute: "2-digit",
        hour12,
      };
  }
}

export function formatDateTime(
  value: DateInput,
  preset: DateTimePreset,
  ctx: FormatContext,
): string {
  return getCachedIntlDateFormatter(preset, ctx).format(toDate(value));
}

export function formatDateTimeRange(
  start: DateInput,
  end: DateInput,
  preset: DateTimePreset,
  ctx: FormatContext,
): string {
  return getCachedIntlDateFormatter(preset, ctx).formatRange(
    toDate(start),
    toDate(end),
  );
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
