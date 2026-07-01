"use client";

import React from "react";
import { useLocale } from "@/lib/locale/client";
import { getLocaleDefaults } from "@/lib/localization/locales";
import type { Localization } from "@/lib/localization/schema";

const LocalizationContext = React.createContext<Localization | null>(null);

LocalizationContext.displayName = "LocalizationContext";

export function LocalizationProvider({
  children,
  defaults,
}: {
  children?: React.ReactNode;
  defaults: Localization;
}) {
  return (
    <LocalizationContext.Provider value={defaults}>
      {children}
    </LocalizationContext.Provider>
  );
}

// Never throws: the provider is an optional enhancement that supplies the user's
// saved preferences. Without it, formatting still works from the active locale
// (guaranteed on server and client) and that locale's defaults.
export function useLocalization(): Localization {
  const ctx = React.useContext(LocalizationContext);
  const { locale } = useLocale();
  return ctx ?? { locale, ...getLocaleDefaults(locale) };
}
