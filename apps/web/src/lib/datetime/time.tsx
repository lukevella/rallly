"use client";

import { useDateTimeConfig } from "@/lib/datetime/client";
import type { DateInput, DateTimePreset } from "@/lib/datetime/format";
import { formatDateTime, formatDateTimeRange } from "@/lib/datetime/format";
import { toISO } from "./utils";

export type TimeProps = {
  value: DateInput;
  preset?: DateTimePreset;
  /** Display zone (e.g. a venue's zone). Omit to show the viewer's local time. */
  timeZone?: string;
  /** Overrides the default rule: show the zone when it isn't the viewer's. */
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
  const config = useDateTimeConfig();
  const displayTimeZone = timeZone ?? config.timeZone;

  // The viewer's zone isn't known until the provider detects it on the
  // client; render a non-breaking space (preserves the line height) rather
  // than a time that may be wrong.
  if (!displayTimeZone) {
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
        showTimeZone:
          showTimeZone ?? Boolean(timeZone && timeZone !== config.timeZone),
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
  /** Overrides the default rule: show the zone when it isn't the viewer's. */
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
  const config = useDateTimeConfig();
  const displayTimeZone = timeZone ?? config.timeZone;

  // The viewer's zone isn't known until the provider detects it on the
  // client; render a non-breaking space (preserves the line height) rather
  // than a time that may be wrong.
  if (!displayTimeZone) {
    return <span className={className}>{" "}</span>;
  }

  return (
    <span className={className}>
      {formatDateTimeRange(start, end, {
        preset,
        locale: config.locale,
        timeFormat: config.timeFormat,
        timeZone: displayTimeZone,
        showTimeZone:
          showTimeZone ?? Boolean(timeZone && timeZone !== config.timeZone),
      })}
    </span>
  );
}
