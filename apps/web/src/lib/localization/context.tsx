"use client";

import type { TimeFormat } from "@rallly/database";
import React from "react";
import { useRequiredContext } from "@/components/use-required-context";
import {
  setTimeFormatCookie,
  setTimeZoneCookie,
  setWeekStartCookie,
} from "@/lib/localization/cookies";
import type { Localization } from "@/lib/localization/schema";

type LocalizationContextValue = Localization & {
  setTimeZone: (timeZone: string) => void;
  setTimeFormat: (timeFormat: TimeFormat) => void;
  setWeekStart: (weekStart: number) => void;
};

const LocalizationContext =
  React.createContext<LocalizationContextValue | null>(null);

LocalizationContext.displayName = "LocalizationContext";

export function LocalizationProvider({
  children,
  initial,
}: {
  children?: React.ReactNode;
  initial: Localization;
}) {
  const [state, setState] = React.useState(initial);

  // Each setter updates local state instantly, then persists to the cookie
  // (next-request SSR / cross-device read). No DB write — that happens only on
  // an explicit save in the "Language & Region" settings — and no router.refresh.
  const setTimeZone = React.useCallback((timeZone: string) => {
    setState((prev) => ({ ...prev, timeZone }));
    setTimeZoneCookie(timeZone);
  }, []);

  const setTimeFormat = React.useCallback((timeFormat: TimeFormat) => {
    setState((prev) => ({ ...prev, timeFormat }));
    setTimeFormatCookie(timeFormat);
  }, []);

  const setWeekStart = React.useCallback((weekStart: number) => {
    setState((prev) => ({ ...prev, weekStart }));
    setWeekStartCookie(weekStart);
  }, []);

  const value = React.useMemo(
    () => ({ ...state, setTimeZone, setTimeFormat, setWeekStart }),
    [state, setTimeZone, setTimeFormat, setWeekStart],
  );

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  return useRequiredContext(LocalizationContext);
}

// Timezone is its own concern → thin selector.
export function useTimeZone() {
  return useLocalization().timeZone;
}
