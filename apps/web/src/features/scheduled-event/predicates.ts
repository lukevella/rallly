import type { Prisma } from "@rallly/database";
import {
  calendarDateToUTCMidnight,
  getCalendarDate,
} from "@/lib/datetime/utils";

// For allDay rows, `start`/`end` are calendar dates encoded as UTC midnight,
// not instants, so they must be compared against "today in the viewer's zone"
// encoded the same way. `end` is stored exclusive (start + 1 day), so
// `end > todayUtcMidnight` keeps an event through its final day and handles
// multi-day spans. The timed arm uses `end > now` so in-progress meetings
// still count as upcoming.
export function upcomingScheduledEventWhere({
  now,
  timeZone,
}: {
  now: Date;
  timeZone: string;
}) {
  const todayUtcMidnight = calendarDateToUTCMidnight(
    getCalendarDate(now, timeZone),
  );
  return {
    status: "confirmed",
    deletedAt: null,
    OR: [
      { allDay: false, end: { gt: now } },
      { allDay: true, end: { gt: todayUtcMidnight } },
    ],
  } satisfies Prisma.ScheduledEventWhereInput;
}

// Exact negation of upcomingScheduledEventWhere so past/upcoming partition
// with no event in neither or both.
export function pastScheduledEventWhere({
  now,
  timeZone,
}: {
  now: Date;
  timeZone: string;
}) {
  const todayUtcMidnight = calendarDateToUTCMidnight(
    getCalendarDate(now, timeZone),
  );
  return {
    status: "confirmed",
    deletedAt: null,
    OR: [
      { allDay: false, end: { lte: now } },
      { allDay: true, end: { lte: todayUtcMidnight } },
    ],
  } satisfies Prisma.ScheduledEventWhereInput;
}
