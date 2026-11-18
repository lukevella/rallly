import type { TimeFormat } from "@/lib/datetime/types";

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

// `firstDay` is 1..7 (Mon..Sun); map to JS 0..6 (Sun..Sat).
function getWeekStart(locale: string) {
  return getWeekInfo(locale).firstDay % 7;
}

/**
 * The browser's region week start, used only under the bare "en" UI. Every
 * other UI locale names its region (en-GB, pt-BR) or implies it through its
 * language (de, sv), and a language the viewer chose beats an Accept-Language
 * header they never set. Bare "en" alone guesses the US, so there a tag that
 * names a region explicitly ("en-SE", "sv-SE") wins. Tags without a region
 * are skipped: "en" would restate the US guess. Uncached, because the tags
 * come from request headers.
 */
export function getWeekStartFromLanguageTags({
  locale,
  tags,
}: {
  locale: string;
  tags: string[];
}) {
  if (locale !== "en") {
    return undefined;
  }
  for (const tag of tags) {
    try {
      if (new Intl.Locale(tag).region) {
        return getWeekStart(tag);
      }
    } catch {
      // Intl.Locale throws a RangeError for a malformed tag
    }
  }
  return undefined;
}

type Weekday = { day: number; label: string; short: string };

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
    // The abbreviated form for compact controls; the long form stays the
    // accessible name so screen readers hear "Monday", not "Mon".
    const shortFormatter = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      timeZone: "UTC",
    });
    const { weekStart } = getLocaleDefaults(locale);
    weekdays = Array.from({ length: 7 }, (_, index) => {
      const day = (weekStart + index) % 7;
      const date = new Date(Date.UTC(2024, 0, 7 + day));
      return {
        day,
        label: formatter.format(date),
        short: shortFormatter.format(date),
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

    const weekStart = getWeekStart(locale);

    defaults = { weekStart, timeFormat };
    cache.set(locale, defaults);
  }
  return defaults;
}
