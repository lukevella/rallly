"use client";

import { useLocalization } from "@/lib/localization/context";
import type {
  CalendarPreset,
  DateInput,
  DateTimePreset,
} from "@/lib/localization/format";
import {
  formatCalendarDate,
  formatDateTime,
  formatDateTimeRange,
  formatRelativeTime,
} from "@/lib/localization/format";

function toISO(value: DateInput) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function toISODate(value: DateInput) {
  return toISO(value).slice(0, 10);
}

type TimeProps = {
  value: DateInput;
  preset?: DateTimePreset;
  /** Fixed display zone (the event's zone, or "UTC" for all-day). Omit for the viewer's zone. */
  timeZone?: string;
  className?: string;
};

export function Time({
  value,
  preset = "time",
  timeZone,
  className,
}: TimeProps) {
  const { locale, timeFormat } = useLocalization();

  return (
    <time dateTime={toISO(value)} className={className}>
      {formatDateTime(value, preset, {
        locale,
        timeFormat,
        timeZone,
      })}
    </time>
  );
}

type TimeRangeProps = {
  start: DateInput;
  end: DateInput;
  preset?: DateTimePreset;
  timeZone?: string;
  className?: string;
};

export function TimeRange({
  start,
  end,
  preset = "time",
  timeZone,
  className,
}: TimeRangeProps) {
  const { locale, timeFormat } = useLocalization();

  return (
    <span className={className}>
      {formatDateTimeRange(start, end, preset, {
        locale,
        timeFormat,
        timeZone,
      })}
    </span>
  );
}

// No `timeZone` prop by design: a calendar date has no zone, so it must not be
// converted or it would drift a day.
export function DateValue({
  value,
  preset = "date",
  className,
}: {
  value: DateInput;
  preset?: CalendarPreset;
  className?: string;
}) {
  const { locale } = useLocalization();

  return (
    <time dateTime={toISODate(value)} className={className}>
      {formatCalendarDate(value, preset, locale)}
    </time>
  );
}

export function RelativeTime({
  value,
  className,
}: {
  value: DateInput;
  className?: string;
}) {
  const { locale } = useLocalization();

  return (
    <time dateTime={toISO(value)} className={className}>
      {formatRelativeTime(value, locale)}
    </time>
  );
}
