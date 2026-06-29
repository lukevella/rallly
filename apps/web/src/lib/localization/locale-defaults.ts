import type { TimeFormat } from "@rallly/database";
import type { SupportedLocale } from "@rallly/languages";

type LocaleDefaults = {
  weekStart: number;
  timeFormat: TimeFormat;
};

// Default time format / week start per locale. Server-safe (no dayjs imports)
// so `getLocalization()` can resolve fallbacks.
const localeDefaults: Record<SupportedLocale, LocaleDefaults> = {
  en: { weekStart: 1, timeFormat: "hours12" },
  "en-GB": { weekStart: 1, timeFormat: "hours24" },
  es: { weekStart: 1, timeFormat: "hours24" },
  da: { weekStart: 1, timeFormat: "hours24" },
  de: { weekStart: 1, timeFormat: "hours24" },
  fi: { weekStart: 1, timeFormat: "hours24" },
  fr: { weekStart: 1, timeFormat: "hours24" },
  it: { weekStart: 1, timeFormat: "hours24" },
  sv: { weekStart: 1, timeFormat: "hours24" },
  cs: { weekStart: 1, timeFormat: "hours24" },
  pl: { weekStart: 1, timeFormat: "hours24" },
  pt: { weekStart: 1, timeFormat: "hours24" },
  "pt-BR": { weekStart: 0, timeFormat: "hours24" },
  ru: { weekStart: 1, timeFormat: "hours24" },
  nl: { weekStart: 1, timeFormat: "hours24" },
  no: { weekStart: 1, timeFormat: "hours24" },
  hu: { weekStart: 1, timeFormat: "hours24" },
  zh: { weekStart: 1, timeFormat: "hours24" },
};

export function getLocaleDefaults(locale: string): LocaleDefaults {
  return localeDefaults[locale as SupportedLocale] ?? localeDefaults.en;
}
