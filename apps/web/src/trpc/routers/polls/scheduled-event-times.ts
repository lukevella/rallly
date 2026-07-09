import {
  calendarDateToUTCMidnight,
  getCalendarDate,
  toISODate,
} from "@/lib/datetime/utils";

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

// All-day events are floating: start/end sit at exactly UTC midnight with no
// time zone. The upcoming-events predicate, finalize emails, and ICS files all
// read all-day dates via UTC, so any other encoding renders off by one day.
export function getScheduledEventTimes({
  startTime,
  duration,
  timeZone,
}: {
  startTime: Date;
  duration: number;
  timeZone: string | null;
}) {
  if (duration > 0) {
    return {
      allDay: false as const,
      start: startTime,
      end: new Date(startTime.getTime() + duration * MINUTE_MS),
      timeZone,
    };
  }

  // Mixed polls used to encode date-only options at midnight in the poll's
  // zone; snap those to the zone's calendar date. Options already at UTC
  // midnight are correctly encoded and must not be shifted.
  const isUtcMidnight = startTime.getTime() % DAY_MS === 0;
  const start = calendarDateToUTCMidnight(
    timeZone && !isUtcMidnight
      ? getCalendarDate(startTime, timeZone)
      : toISODate(startTime),
  );

  return {
    allDay: true as const,
    start,
    end: new Date(start.getTime() + DAY_MS),
    timeZone: null,
  };
}
