"use client";

import { useDateTimeConfig } from "@/lib/datetime/client";
import type { DateTimePreset } from "@/lib/datetime/format";
import { formatDateTime, formatDateTimeRange } from "@/lib/datetime/format";
import type { DateInput } from "@/lib/datetime/types";
import { useHydrated } from "@/lib/datetime/use-hydrated";
import { toISO } from "./utils";

export type TimeProps = {
  value: DateInput;
  preset?: DateTimePreset;
  /** Display zone (e.g. a venue's zone). Omit to show the viewer's local time. */
  timeZone?: string;
  /** Append the zone name (e.g. "GMT+1"). Off unless set. */
  showTimeZone?: boolean;
  className?: string;
};

export function Time({
  value,
  preset = "datetime",
  timeZone,
  showTimeZone,
  className,
}: TimeProps) {
  const hydrated = useHydrated();
  const config = useDateTimeConfig();
  const displayTimeZone = timeZone ?? config.timeZone;

  // Intl output isn't stable across engines, so it can't be rendered on the
  // server; render a non-breaking space (preserves the line height) until
  // hydration and until the viewer's zone is known.
  if (!hydrated || !displayTimeZone) {
    return (
      <time dateTime={toISO(value)} className={className}>
        {" "}
      </time>
    );
  }

  return (
    <time dateTime={toISO(value)} className={className}>
      {formatDateTime(value, {
        preset,
        locale: config.locale,
        timeFormat: config.timeFormat,
        timeZone: displayTimeZone,
        showTimeZone,
      })}
    </time>
  );
}

export type TimeRangeProps = {
  start: DateInput;
  end: DateInput;
  preset?: DateTimePreset;
  /** Display zone (e.g. a venue's zone). Omit to show the viewer's local time. */
  timeZone?: string;
  /** Append the zone name (e.g. "GMT+1"). Off unless set. */
  showTimeZone?: boolean;
  className?: string;
};

export function TimeRange({
  start,
  end,
  preset = "time",
  timeZone,
  showTimeZone,
  className,
}: TimeRangeProps) {
  const hydrated = useHydrated();
  const config = useDateTimeConfig();
  const displayTimeZone = timeZone ?? config.timeZone;

  // Intl output isn't stable across engines, so it can't be rendered on the
  // server; render a non-breaking space (preserves the line height) until
  // hydration and until the viewer's zone is known.
  if (!hydrated || !displayTimeZone) {
    return <span className={className}>{" "}</span>;
  }

  return (
    <span className={className}>
      {formatDateTimeRange(start, end, {
        preset,
        locale: config.locale,
        timeFormat: config.timeFormat,
        timeZone: displayTimeZone,
        showTimeZone,
      })}
    </span>
  );
}
