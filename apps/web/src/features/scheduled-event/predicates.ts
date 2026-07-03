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
// still count as upcoming. A single core with the gt/lte complements side by
// side makes past the exact negation of upcoming structurally, so the two
// cannot drift apart.
function scheduledEventWhere({
  now,
  timeZone,
  past,
}: {
  now: Date;
  timeZone: string;
  past: boolean;
}) {
  const todayUtcMidnight = calendarDateToUTCMidnight(
    getCalendarDate(now, timeZone),
  );
  return {
    status: "confirmed",
    deletedAt: null,
    OR: [
      { allDay: false, end: past ? { lte: now } : { gt: now } },
      {
        allDay: true,
        end: past ? { lte: todayUtcMidnight } : { gt: todayUtcMidnight },
      },
    ],
  } satisfies Prisma.ScheduledEventWhereInput;
}

export function upcomingScheduledEventWhere(args: {
  now: Date;
  timeZone: string;
}) {
  return scheduledEventWhere({ ...args, past: false });
}

export function pastScheduledEventWhere(args: { now: Date; timeZone: string }) {
  return scheduledEventWhere({ ...args, past: true });
}
