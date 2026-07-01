"use client";

import React from "react";
import { useRequiredContext } from "@/components/use-required-context";
import type { Localization } from "@/lib/localization/schema";

type LocalizationContextValue = Localization;

const LocalizationContext =
  React.createContext<LocalizationContextValue | null>(null);

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

export function useLocalization() {
  return useRequiredContext(LocalizationContext);
}
