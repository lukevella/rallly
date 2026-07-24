"use client";

import type * as React from "react";
import { I18nProvider } from "react-aria-components";

/**
 * Provides the locale to react-aria components (date/time pickers, calendars).
 * They read locale only from context, so one provider near the app root serves
 * every such component below it — no per-component wrapping needed.
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  return <I18nProvider locale={locale}>{children}</I18nProvider>;
}
