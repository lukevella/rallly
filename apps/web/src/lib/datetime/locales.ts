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
