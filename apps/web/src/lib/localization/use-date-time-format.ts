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
  const { locale, timeZone: viewerTimeZone, timeFormat } = useLocalization();
  const automaticTimeZone = viewerTimeZone ?? getBrowserTimeZone();

  return React.useMemo(() => {
    // `timeZone` is the fixed display zone (the event's zone, or "UTC" for
    // all-day); omit it to use the viewer's zone.
    const ctx = (timeZone?: string) => ({
      locale,
      timeFormat,
      timeZone: timeZone ?? automaticTimeZone,
    });
    return {
      format: (
        value: DateInput,
        preset: DateTimePreset,
        opts?: { timeZone?: string },
      ) => formatDateTime(value, preset, ctx(opts?.timeZone)),
      formatRange: (
        start: DateInput,
        end: DateInput,
        preset: DateTimePreset,
        opts?: { timeZone?: string },
      ) => formatDateTimeRange(start, end, preset, ctx(opts?.timeZone)),
      formatRelative: (value: DateInput, now?: DateInput) =>
        formatRelativeTime(value, locale, now),
    };
  }, [locale, timeFormat, automaticTimeZone]);
}
