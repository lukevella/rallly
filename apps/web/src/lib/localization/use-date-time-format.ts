"use client";

import React from "react";
import { useLocalization } from "@/lib/localization/context";
import type { DateInput, DateTimePreset } from "@/lib/localization/format";
import {
  formatDateTime,
  formatDateTimeRange,
  formatRelativeTime,
} from "@/lib/localization/format";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

/**
 * Imperative date/time formatting for non-children contexts (aria-labels,
 * `title` attributes, third-party localizers). For rendering into JSX prefer
 * the `<Time>` / `<TimeRange>` / `<RelativeTime>` components, which handle the
 * SSR/skeleton fallback.
 */
export function useDateTimeFormat() {
  const { locale, timeZone, timeFormat } = useLocalization();
  const resolvedTimeZone = timeZone ?? getBrowserTimeZone();

  return React.useMemo(() => {
    const ctx = (floating?: boolean) => ({
      locale,
      timeFormat,
      timeZone: floating ? "UTC" : resolvedTimeZone,
    });
    return {
      format: (
        value: DateInput,
        preset: DateTimePreset,
        opts?: { floating?: boolean },
      ) => formatDateTime(value, preset, ctx(opts?.floating)),
      formatRange: (
        start: DateInput,
        end: DateInput,
        preset: DateTimePreset,
        opts?: { floating?: boolean },
      ) => formatDateTimeRange(start, end, preset, ctx(opts?.floating)),
      formatRelative: (value: DateInput, now?: DateInput) =>
        formatRelativeTime(value, locale, now),
    };
  }, [locale, timeFormat, resolvedTimeZone]);
}
