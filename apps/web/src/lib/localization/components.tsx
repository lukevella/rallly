"use client";

import { cn } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";
import React from "react";
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
import { getBrowserTimeZone } from "@/utils/date-time-utils";

function toISO(value: DateInput) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function toISODate(value: DateInput) {
  return toISO(value).slice(0, 10);
}

function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

// An explicit `timeZone` (the event's zone, or "UTC" for floating/all-day) is
// always known. Otherwise use the viewer's saved zone; if they have none, fall
// back to the browser zone after mount — the server can't know it, so callers
// render a skeleton until then rather than guessing.
function useDisplayTimeZone(fixedTimeZone?: string) {
  const { timeZone: viewerTimeZone } = useLocalization();
  const mounted = useMounted();
  if (fixedTimeZone) return fixedTimeZone;
  return viewerTimeZone || (mounted ? getBrowserTimeZone() : undefined);
}

function TimeSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("inline-block h-[1em] w-12 align-middle", className)}
    />
  );
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
  const displayTimeZone = useDisplayTimeZone(timeZone);

  if (!displayTimeZone) {
    return <TimeSkeleton className={className} />;
  }

  return (
    <time dateTime={toISO(value)} className={className}>
      {formatDateTime(value, preset, {
        locale,
        timeFormat,
        timeZone: displayTimeZone,
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
  const displayTimeZone = useDisplayTimeZone(timeZone);

  if (!displayTimeZone) {
    return <TimeSkeleton className={cn("w-24", className)} />;
  }

  return (
    <span className={className}>
      {formatDateTimeRange(start, end, preset, {
        locale,
        timeFormat,
        timeZone: displayTimeZone,
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
