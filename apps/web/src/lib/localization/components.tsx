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
 * Resolves the timezone for display. `floating` values are wall-clock
 * (all-day / tz-agnostic) and format in UTC. Otherwise we use the localization
 * timezone when known (SSR-personalized), falling back to the browser zone
 * after mount — `undefined` before that, so the caller renders a skeleton.
 */
function useDisplayTimeZone(floating?: boolean) {
  const { timeZone } = useLocalization();
  const mounted = useMounted();
  if (floating) return "UTC";
  return timeZone ?? (mounted ? getBrowserTimeZone() : undefined);
}

type TimeProps = {
  value: DateInput;
  preset?: DateTimePreset;
  floating?: boolean;
  className?: string;
};

export function Time({
  value,
  preset = "time",
  floating,
  className,
}: TimeProps) {
  const { locale, timeFormat } = useLocalization();
  const timeZone = useDisplayTimeZone(floating);

  if (!timeZone) {
    return <TimeSkeleton className={className} />;
  }

  return (
    <time dateTime={toISO(value)} className={className}>
      {formatDateTime(value, preset, { locale, timeFormat, timeZone })}
    </time>
  );
}

type TimeRangeProps = {
  start: DateInput;
  end: DateInput;
  preset?: DateTimePreset;
  floating?: boolean;
  className?: string;
};

export function TimeRange({
  start,
  end,
  preset = "time",
  floating,
  className,
}: TimeRangeProps) {
  const { locale, timeFormat } = useLocalization();
  const timeZone = useDisplayTimeZone(floating);

  if (!timeZone) {
    return <TimeSkeleton className={cn("w-24", className)} />;
  }

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
