import * as ics from "ics";

const productId = "-//Rallly//EN";

export interface CreateIcsEventOptions {
  uid: string;
  sequence?: number;
  start: Date;
  end: Date;
  allDay: boolean;
  timeZone?: string;
  title: string;
  description?: string;
  location?: string;
  organizer?: {
    name: string;
    email: string;
  };
  attendees?: Array<{
    name: string;
    email: string;
  }>;
  method?: "request" | "publish" | "cancel";
  status?: ics.EventStatus;
}

/**
 * Creates an ICS event with proper date/time handling
 * Handles all-day events, timezone conversions, and floating time automatically
 */
export function createIcsEvent({
  uid,
  start,
  end,
  allDay,
  timeZone,
  sequence = 0,
  title,
  description,
  location,
  organizer,
  attendees,
  method = "request",
  status = "CONFIRMED",
}: CreateIcsEventOptions): {
  error?: Error;
  value?: string;
} {
  return ics.createEvent({
    uid,
    productId,
    sequence,
    title,
    description,
    location,
    organizer,
    attendees,
    method,
    status,
    startInputType: timeZone ? "utc" : "local",
    startOutputType: timeZone ? "utc" : "local",
    ...(allDay
      ? {
          start: [
            start.getUTCFullYear(),
            start.getUTCMonth() + 1,
            start.getUTCDate(),
          ],
          end: [end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate()],
        }
      : {
          start: [
            start.getUTCFullYear(),
            start.getUTCMonth() + 1,
            start.getUTCDate(),
            start.getUTCHours(),
            start.getUTCMinutes(),
          ],
          end: [
            end.getUTCFullYear(),
            end.getUTCMonth() + 1,
            end.getUTCDate(),
            end.getUTCHours(),
            end.getUTCMinutes(),
          ],
        }),
  });
}
