"use client";

import { useDateTimeConfig } from "@/lib/datetime/client";
import { formatDateParts } from "@/lib/datetime/format";
import {
  CalendarCard,
  CalendarCardDay,
  CalendarCardMonth,
} from "./calendar-card";

/**
 * Month/day chip for the event's start, in the event's display zone:
 * a set zone (venue/legacy) wins, otherwise the viewer's zone. All-day
 * values are stored as UTC midnight so they always read in UTC.
 */
export function EventCalendarCard({
  start,
  allDay,
  displayTimeZone,
}: {
  start: Date;
  allDay: boolean;
  displayTimeZone: string | null;
}) {
  const config = useDateTimeConfig();
  const timeZone = allDay ? "UTC" : (displayTimeZone ?? config.timeZone);

  // The viewer's zone isn't known until the provider detects it on the
  // client; keep the chip's layout without committing to a date.
  if (!timeZone) {
    return (
      <CalendarCard>
        <CalendarCardMonth> </CalendarCardMonth>
        <CalendarCardDay> </CalendarCardDay>
      </CalendarCard>
    );
  }

  const parts = formatDateParts(start, { locale: config.locale, timeZone });

  return (
    <CalendarCard>
      <CalendarCardMonth>{parts.month}</CalendarCardMonth>
      <CalendarCardDay>{parts.day}</CalendarCardDay>
    </CalendarCard>
  );
}
