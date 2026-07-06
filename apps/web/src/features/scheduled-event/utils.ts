import {
  formatDateParts,
  formatDateTime,
  formatDateTimeRange,
} from "@/lib/datetime/format";
import type { TimeFormat } from "@/lib/datetime/schema";

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
