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
export function createIcsEvent(options: CreateIcsEventOptions): {
  error?: Error;
  value?: string;
} {
  const {
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
  } = options;

  let eventAttributes: ics.EventAttributes;

  if (allDay) {
    // All-day events: use date-only format (3 values)
    eventAttributes = {
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
      start: [start.getFullYear(), start.getMonth() + 1, start.getDate()],
      end: [end.getFullYear(), end.getMonth() + 1, end.getDate()],
    };
  } else if (timeZone) {
    // Timezone-aware events: convert to UTC
    eventAttributes = {
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
      startInputType: "utc",
    };
  } else {
    // Floating time events: use local time values
    eventAttributes = {
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
      start: [
        start.getFullYear(),
        start.getMonth() + 1,
        start.getDate(),
        start.getHours(),
        start.getMinutes(),
      ],
      end: [
        end.getFullYear(),
        end.getMonth() + 1,
        end.getDate(),
        end.getHours(),
        end.getMinutes(),
      ],
      startInputType: "local",
    };
  }

  return ics.createEvent(eventAttributes);
}
