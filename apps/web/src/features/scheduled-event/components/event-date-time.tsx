"use client";

import {
  CalendarCard,
  CalendarCardDay,
  CalendarCardMonth,
} from "@/components/calendar-card";
import { Trans } from "@/i18n/client";
import { CalendarDate } from "@/lib/datetime/calendar-date";
import { useDateTimeConfig } from "@/lib/datetime/client";
import type { DateInput, DatePreset } from "@/lib/datetime/format";
import { formatDateParts } from "@/lib/datetime/format";
import { Time, TimeRange } from "@/lib/datetime/time";
import { useHydrated } from "@/lib/datetime/use-hydrated";

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
        className={className}
      />
    );
  }
  return (
    <Time
      value={value}
      preset={preset}
      className={className}
      showTimeZone={false}
    />
  );
}

/**
 * Month/day chip for the event's start. Resolves the display zone the same
 * way as EventDate: all-day and floating values are stored as UTC wall time
 * and read in UTC; fixed instants show in the viewer's zone.
 */
export function EventCalendarCard({
  start,
  allDay,
  timeZone,
  className,
}: SchedulingFields & {
  start: DateInput;
  className?: string;
}) {
  const hydrated = useHydrated();
  const config = useDateTimeConfig();
  const displayTimeZone = allDay || timeZone === null ? "UTC" : config.timeZone;

  // Intl output isn't stable across engines, so it can't be rendered on the
  // server; keep the chip's layout without committing to a date until
  // hydration and until the viewer's zone is known.
  if (!hydrated || !displayTimeZone) {
    return (
      <CalendarCard className={className}>
        <CalendarCardMonth> </CalendarCardMonth>
        <CalendarCardDay> </CalendarCardDay>
      </CalendarCard>
    );
  }

  const parts = formatDateParts(start, {
    locale: config.locale,
    timeZone: displayTimeZone,
  });

  return (
    <CalendarCard className={className}>
      <CalendarCardMonth>{parts.month}</CalendarCardMonth>
      <CalendarCardDay>{parts.day}</CalendarCardDay>
    </CalendarCard>
  );
}

export function EventTimeRange({
  start,
  end,
  allDay,
  timeZone,
  showTimeZone,
  className,
}: SchedulingFields & {
  start: DateInput;
  end: DateInput;
  /** Show the zone label on fixed times; floating times never show one. */
  showTimeZone?: boolean;
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
      <TimeRange start={start} end={end} timeZone="UTC" className={className} />
    );
  }
  return (
    <TimeRange
      start={start}
      end={end}
      showTimeZone={showTimeZone}
      className={className}
    />
  );
}
