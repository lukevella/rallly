"use client";

import { Trans } from "@/i18n/client";
import { CalendarDate } from "@/lib/datetime/calendar-date";
import type { DateInput, DatePreset } from "@/lib/datetime/format";
import { Time, TimeRange } from "@/lib/datetime/time";

/**
 * Raw scheduling fields as stored on a scheduled event. `timeZone` is
 * required so callers can't drop the null (floating) case: null means the
 * stored wall time is shown as-is to everyone; a set zone means a fixed
 * instant shown in the viewer's time zone.
 */
type SchedulingFields = {
  allDay: boolean;
  timeZone: string | null;
};

export function EventDate({
  value,
  allDay,
  timeZone,
  preset = "dateLong",
  className,
}: SchedulingFields & {
  value: DateInput;
  preset?: DatePreset;
  className?: string;
}) {
  if (allDay) {
    return <CalendarDate value={value} preset={preset} className={className} />;
  }
  if (timeZone === null) {
    return (
      <Time
        value={value}
        preset={preset}
        timeZone="UTC"
        showTimeZone={false}
        className={className}
      />
    );
  }
  return <Time value={value} preset={preset} className={className} />;
}

export function EventTimeRange({
  start,
  end,
  allDay,
  timeZone,
  className,
}: SchedulingFields & {
  start: DateInput;
  end: DateInput;
  className?: string;
}) {
  if (allDay) {
    return (
      <span className={className}>
        <Trans i18nKey="allDay" defaults="All day" />
      </span>
    );
  }
  if (timeZone === null) {
    return (
      <TimeRange
        start={start}
        end={end}
        timeZone="UTC"
        showTimeZone={false}
        className={className}
      />
    );
  }
  return <TimeRange start={start} end={end} className={className} />;
}
