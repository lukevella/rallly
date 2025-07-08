import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

export interface FormattedEventDateTime {
  date: string;
  day: string;
  dow: string;
  time: string;
}

interface FormatEventDateTimeOptions {
  start: Date;
  end: Date;
  allDay: boolean;
  timeZone?: string | null;
  inviteeTimeZone?: string | null;
}

/**
 * Formats event date and time based on event type and timezone settings
 *
 * Handles three scenarios:
 * 1. All-day events (same date for everyone)
 * 2. Events with a timezone (adjust to invitee's timezone if available)
 * 3. Events without a timezone (floating time - show in UTC)
 */
export const formatEventDateTime = ({
  start,
  end,
  allDay,
  timeZone,
  inviteeTimeZone,
}: FormatEventDateTimeOptions): FormattedEventDateTime => {
  if (allDay) {
    // For all-day events, show the same date to everyone
    const eventDate = dayjs(start).utc();
    return {
      date: eventDate.format("MMMM D, YYYY"),
      day: eventDate.format("D"),
      dow: eventDate.format("ddd"),
      time: "All day",
    };
  }

  if (timeZone) {
    // If event has a timezone, adjust to invitee's timezone if available
    const targetTimeZone = inviteeTimeZone || timeZone;

    const startTime = dayjs(start).tz(targetTimeZone);
    const endTime = dayjs(end).tz(targetTimeZone);

    return {
      date: startTime.format("MMMM D, YYYY"),
      day: startTime.format("D"),
      dow: startTime.format("ddd"),
      time: `${startTime.format("HH:mm")} - ${endTime.format("HH:mm z")}`,
    };
  }

  const startTime = dayjs(start).utc();
  const endTime = dayjs(end).utc();

  return {
    date: startTime.format("MMMM D, YYYY"),
    day: startTime.format("D"),
    dow: startTime.format("ddd"),
    time: `${startTime.format("HH:mm")} - ${endTime.format("HH:mm")}`,
  };
};
