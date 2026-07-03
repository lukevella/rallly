import type { TimeFormat } from "@rallly/database";

type LocaleDefaults = {
  weekStart: number;
  timeFormat: TimeFormat;
};

type WeekInfo = { firstDay: number };

// `getWeekInfo()` (spec) / `.weekInfo` (older engines) isn't in every TS lib yet.
function getWeekInfo(locale: string): WeekInfo {
  const l = new Intl.Locale(locale) as Intl.Locale & {
    getWeekInfo?: () => WeekInfo;
    weekInfo?: WeekInfo;
  };
  return l.getWeekInfo?.() ?? l.weekInfo ?? { firstDay: 1 };
}

type Weekday = { day: number; label: string };

const weekdayCache = new Map<string, Weekday[]>();

// 2024-01-07 is a Sunday; formatting in UTC keeps the 0=Sunday mapping. Days
// are ordered from the locale's default week start; `day` stays canonical
// (0=Sunday .. 6=Saturday).
export function getWeekdayNames(locale: string): Weekday[] {
  let weekdays = weekdayCache.get(locale);
  if (!weekdays) {
    const formatter = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      timeZone: "UTC",
    });
    const { weekStart } = getLocaleDefaults(locale);
    weekdays = Array.from({ length: 7 }, (_, index) => {
      const day = (weekStart + index) % 7;
      return {
        day,
        label: formatter.format(new Date(Date.UTC(2024, 0, 7 + day))),
      };
    });
    weekdayCache.set(locale, weekdays);
  }
  return weekdays;
}

const cache = new Map<string, LocaleDefaults>();

export function getLocaleDefaults(locale: string): LocaleDefaults {
  let defaults = cache.get(locale);
  if (!defaults) {
    const hourCycle = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
    }).resolvedOptions().hourCycle;
    const timeFormat: TimeFormat =
      hourCycle === "h11" || hourCycle === "h12" ? "hours12" : "hours24";

    // `firstDay` is 1..7 (Mon..Sun); map to JS 0..6 (Sun..Sat).
    const weekStart = getWeekInfo(locale).firstDay % 7;

    defaults = { weekStart, timeFormat };
    cache.set(locale, defaults);
  }
  return defaults;
}
