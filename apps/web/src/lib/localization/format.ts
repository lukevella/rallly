import type { Localization } from "@/lib/localization/schema";

export type DateInput = Date | string | number;

export type DateTimePreset =
  | "time"
  | "date"
  | "dateLong"
  | "weekday"
  | "datetime";

type FormatContext = Pick<Localization, "locale" | "timeFormat"> & {
  timeZone?: string;
};

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

// Intl.DateTimeFormat construction is comparatively expensive; memoize by
// (locale, options). Formatters are pure and request-agnostic, so sharing the
// cache across requests on the server is safe.
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, options);
    formatterCache.set(key, formatter);
  }
  return formatter;
}

const PRESET_OPTIONS: Record<DateTimePreset, Intl.DateTimeFormatOptions> = {
  time: { timeStyle: "short" },
  date: { dateStyle: "medium" },
  dateLong: { dateStyle: "long" },
  weekday: { weekday: "long" },
  datetime: { dateStyle: "medium", timeStyle: "short" },
};

const PRESET_SHOWS_TIME: Record<DateTimePreset, boolean> = {
  time: true,
  date: false,
  dateLong: false,
  weekday: false,
  datetime: true,
};

// The hour cycle (12/24h) is applied to the *locale*, not the options, so it is
// honored alongside `timeStyle` and keeps every CLDR per-locale nuance intact:
// separators (Finnish "15.30"), leading-zero rules, and meridiem placement.
function resolveLocale(preset: DateTimePreset, ctx: FormatContext): string {
  if (!PRESET_SHOWS_TIME[preset]) return ctx.locale;
  const hourCycle = ctx.timeFormat === "hours12" ? "h12" : "h23";
  return new Intl.Locale(ctx.locale, { hourCycle }).toString();
}

function formatterFor(preset: DateTimePreset, ctx: FormatContext) {
  return getFormatter(resolveLocale(preset, ctx), {
    ...PRESET_OPTIONS[preset],
    timeZone: ctx.timeZone,
  });
}

export function formatDateTime(
  value: DateInput,
  preset: DateTimePreset,
  ctx: FormatContext,
): string {
  return formatterFor(preset, ctx).format(toDate(value));
}

export function formatDateTimeRange(
  start: DateInput,
  end: DateInput,
  preset: DateTimePreset,
  ctx: FormatContext,
): string {
  return formatterFor(preset, ctx).formatRange(toDate(start), toDate(end));
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 31_536_000_000],
  ["month", 2_592_000_000],
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
  ["second", 1_000],
];

const relativeCache = new Map<string, Intl.RelativeTimeFormat>();

function getRelativeFormatter(locale: string) {
  let formatter = relativeCache.get(locale);
  if (!formatter) {
    formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    relativeCache.set(locale, formatter);
  }
  return formatter;
}

export function formatRelativeTime(
  value: DateInput,
  locale: string,
  now: DateInput = new Date(),
): string {
  const diff = toDate(value).getTime() - toDate(now).getTime();
  const formatter = getRelativeFormatter(locale);
  for (const [unit, ms] of RELATIVE_UNITS) {
    if (Math.abs(diff) >= ms || unit === "second") {
      return formatter.format(Math.round(diff / ms), unit);
    }
  }
  return formatter.format(0, "second");
}
