"use client";

import type { TimeFormat } from "@rallly/database";
import { defaultLocale } from "@rallly/languages";
import { useParams } from "next/navigation";
import React from "react";
import type { DateInput, DateTimePreset } from "@/lib/datetime/format";
import {
  formatDateTime as baseFormatDateTime,
  formatDuration as baseFormatDuration,
  formatRelativeTime,
} from "@/lib/datetime/format";
import { getLocaleDefaults, getWeekdayNames } from "@/lib/datetime/locales";
import { normalizeTimeZone } from "@/lib/datetime/utils";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

type DateTimeConfig = {
  locale?: string;
  timeZone?: string;
  timeFormat?: TimeFormat;
  weekStart?: number;
};

const DateTimeContext = React.createContext<DateTimeConfig | undefined>(
  undefined,
);

// Merges with any parent provider so a nested provider can override a single
// field (e.g. a time zone switcher) without restating the rest. Falls back to
// the browser zone when no zone is known; detected in an effect so the server
// and first client render match.
export function DateTimeProvider({
  locale,
  timeZone,
  timeFormat,
  weekStart,
  children,
}: DateTimeConfig & { children: React.ReactNode }) {
  const parent = React.useContext(DateTimeContext);
  const [browserTimeZone, setBrowserTimeZone] = React.useState<string>();

  React.useEffect(() => {
    setBrowserTimeZone(getBrowserTimeZone());
  }, []);

  const value = React.useMemo(
    () => ({
      locale: locale ?? parent?.locale,
      // Stored zones can be empty or corrupt; parent and browser zones are
      // already normalized.
      timeZone:
        normalizeTimeZone(timeZone) ?? parent?.timeZone ?? browserTimeZone,
      timeFormat: timeFormat ?? parent?.timeFormat,
      weekStart: weekStart ?? parent?.weekStart,
    }),
    [locale, timeZone, timeFormat, weekStart, parent, browserTimeZone],
  );

  return (
    <DateTimeContext.Provider value={value}>
      {children}
    </DateTimeContext.Provider>
  );
}

export function useDateTimeConfig() {
  const config = React.useContext(DateTimeContext);
  const params = useParams<{ locale?: string }>();
  const locale = config?.locale ?? params?.locale ?? defaultLocale;

  return {
    locale,
    timeZone: config?.timeZone,
    timeFormat: config?.timeFormat,
    weekStart: config?.weekStart ?? getLocaleDefaults(locale).weekStart,
  };
}

// Formatters bound to the viewer's config so call sites don't thread
// locale/timeZone themselves. UTC covers the pre-hydration window before the
// browser zone is detected.
export function useDateTime() {
  const { locale, timeZone, timeFormat } = useDateTimeConfig();

  return React.useMemo(
    () => ({
      formatDateTime: (
        value: DateInput,
        preset?: DateTimePreset,
        opts?: { timeZone?: string; showTimeZone?: boolean },
      ) =>
        baseFormatDateTime(value, {
          preset,
          locale,
          timeFormat,
          timeZone: opts?.timeZone ?? timeZone ?? "UTC",
          showTimeZone: opts?.showTimeZone,
        }),
      toRelativeTime: (value: DateInput) => formatRelativeTime(value, locale),
      formatDuration: (minutes: number) => baseFormatDuration(minutes, locale),
      weekdays: () => getWeekdayNames(locale),
    }),
    [locale, timeZone, timeFormat],
  );
}
