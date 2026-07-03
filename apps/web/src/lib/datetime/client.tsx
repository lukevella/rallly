"use client";

import type { TimeFormat } from "@rallly/database";
import { defaultLocale } from "@rallly/languages";
import { useParams } from "next/navigation";
import React from "react";
import { normalizeTimeZone } from "@/lib/datetime/utils";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

type DateTimeConfig = {
  locale?: string;
  timeZone?: string;
  timeFormat?: TimeFormat;
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
    }),
    [locale, timeZone, timeFormat, parent, browserTimeZone],
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

  return {
    locale: config?.locale ?? params?.locale ?? defaultLocale,
    timeZone: config?.timeZone,
    timeFormat: config?.timeFormat,
  };
}
