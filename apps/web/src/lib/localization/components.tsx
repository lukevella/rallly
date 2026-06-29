"use client";

import { cn } from "@rallly/ui";
import { Skeleton } from "@rallly/ui/skeleton";
import React from "react";
import { useLocalization } from "@/lib/localization/context";
import type { DateInput, DateTimePreset } from "@/lib/localization/format";
import {
  formatDateTime,
  formatDateTimeRange,
  formatRelativeTime,
} from "@/lib/localization/format";
import { getBrowserTimeZone } from "@/utils/date-time-utils";

function useMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}

function toISO(value: DateInput) {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

export function TimeSkeleton({ className }: { className?: string }) {
  return (
    <Skeleton
      className={cn("inline-block h-[1em] w-12 align-middle", className)}
    />
  );
}

/**
 * Resolves the timezone to display in. A fixed `timeZone` (the event's own zone,
 * or "UTC" for all-day) is known regardless of the viewer, so it renders
 * directly — SSR-safe even for anonymous viewers, no skeleton. Omitting it means
 * "automatic": display in the viewer's zone, falling back to the browser zone
 * after mount (`undefined` before that, so the caller renders a skeleton).
 */
function useDisplayTimeZone(fixedTimeZone?: string) {
  const { timeZone: viewerTimeZone } = useLocalization();
  const mounted = useMounted();
  if (fixedTimeZone) return fixedTimeZone;
  return viewerTimeZone ?? (mounted ? getBrowserTimeZone() : undefined);
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
  /** Fixed display zone (the event's zone, or "UTC" for all-day). Omit for the viewer's zone. */
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

export function RelativeTime({
  value,
  className,
}: {
  value: DateInput;
  className?: string;
}) {
  const { locale } = useLocalization();
  const mounted = useMounted();

  // Relative time depends on "now", which differs between server and client,
  // so render it client-only to avoid a hydration mismatch.
  if (!mounted) {
    return <TimeSkeleton className={className} />;
  }

  return (
    <time dateTime={toISO(value)} className={className}>
      {formatRelativeTime(value, locale)}
    </time>
  );
}
