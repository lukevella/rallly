import type { Prisma, ScheduledEventStatus } from "@rallly/database";
import {
  formatDateParts,
  formatDateTime,
  formatDateTimeRange,
} from "@/lib/datetime/format";
import type { TimeFormat } from "@/lib/datetime/types";
import {
  calendarDateToUTCMidnight,
  getCalendarDate,
} from "@/lib/datetime/utils";

export interface FormattedEventDateTime {
  date: string;
  day: string;
  dow: string;
  /** Undefined for all-day events; the email templates render a localized "All day" label. */
  time?: string;
}

interface FormatEventDateTimeOptions {
  start: Date;
  end: Date;
  allDay: boolean;
  timeZone?: string | null;
  inviteeTimeZone?: string | null;
  /** Must match the locale the email template renders in. */
  locale?: string;
  /** The recipient's preferred hour cycle; the locale decides when unset. */
  timeFormat?: TimeFormat | null;
}

/**
 * Builds the date/time display strings for the finalized/canceled email
 * templates.
 *
 * Zone semantics:
 * - All-day events are stored as UTC midnight and format in UTC, so every
 *   recipient sees the same date.
 * - Fixed events (with a zone) render in the recipient's zone when known,
 *   falling back to the event's zone, with the zone name appended.
 * - Floating events (no zone) render their wall time, stored as UTC, with no
 *   zone name.
 */
export const formatEventDateTime = ({
  start,
  end,
  allDay,
  timeZone,
  inviteeTimeZone,
  locale = "en",
  timeFormat,
}: FormatEventDateTimeOptions): FormattedEventDateTime => {
  const displayTimeZone =
    allDay || !timeZone ? "UTC" : inviteeTimeZone || timeZone;
  const { weekday, day } = formatDateParts(start, {
    locale,
    timeZone: displayTimeZone,
  });

  return {
    date: formatDateTime(start, {
      preset: "dateLong",
      locale,
      timeZone: displayTimeZone,
    }),
    day,
    dow: weekday,
    time: allDay
      ? undefined
      : formatDateTimeRange(start, end, {
          preset: "time",
          locale,
          timeFormat: timeFormat ?? undefined,
          timeZone: displayTimeZone,
          showTimeZone: Boolean(timeZone),
        }),
  };
};

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

export type EventPhase = "canceled" | "ended" | "inProgress" | "upcoming";

/**
 * Resolves the registration-relevant phase of an event. Registration is only
 * open while the event is "upcoming"; every other phase blocks it.
 */
export function getEventPhase({
  status,
  start,
  end,
  now,
}: {
  status: ScheduledEventStatus;
  start: Date;
  end: Date;
  now: Date;
}): EventPhase {
  if (status === "canceled") {
    return "canceled";
  }
  if (now > end) {
    return "ended";
  }
  if (now >= start) {
    return "inProgress";
  }
  return "upcoming";
}

export function isEventFull({
  capacity,
  acceptedCount,
}: {
  capacity: number | null;
  acceptedCount: number;
}) {
  return capacity !== null && acceptedCount >= capacity;
}
