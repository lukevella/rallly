"use client";

import type { TimeFormat } from "@rallly/database";
import React from "react";
import { useRequiredContext } from "@/components/use-required-context";
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
  defaults,
  onTimeZoneChange,
  onTimeFormatChange,
  onWeekStartChange,
}: {
  children?: React.ReactNode;
  defaults: Localization;
  onTimeZoneChange?: (timeZone: string) => void;
  onTimeFormatChange?: (timeFormat: TimeFormat) => void;
  onWeekStartChange?: (weekStart: number) => void;
}) {
  const [state, setState] = React.useState(defaults);

  const setTimeZone = React.useCallback(
    (timeZone: string) => {
      setState((prev) => ({ ...prev, timeZone }));
      onTimeZoneChange?.(timeZone);
    },
    [onTimeZoneChange],
  );

  const setTimeFormat = React.useCallback(
    (timeFormat: TimeFormat) => {
      setState((prev) => ({ ...prev, timeFormat }));
      onTimeFormatChange?.(timeFormat);
    },
    [onTimeFormatChange],
  );

  const setWeekStart = React.useCallback(
    (weekStart: number) => {
      setState((prev) => ({ ...prev, weekStart }));
      onWeekStartChange?.(weekStart);
    },
    [onWeekStartChange],
  );

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

// Thin selectors for the switcher components. Timezone and time format are
// distinct concerns, each exposing its value plus an instant setter.
export function useTimeZone() {
  const { timeZone, setTimeZone } = useLocalization();
  return { timeZone, setTimeZone };
}

export function useTimeFormat() {
  const { timeFormat, setTimeFormat } = useLocalization();
  return { timeFormat, setTimeFormat };
}
