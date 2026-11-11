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
    partstat?: ics.ParticipationStatus;
  }>;
  method?: "request" | "publish" | "cancel";
  status?: ics.EventStatus;
}

/**
 * The library quotes CN but escapes embedded quotes with a backslash, which
 * RFC 5545 forbids in a parameter value; RFC 6868 caret encoding is the spec's
 * way to carry quotes and line breaks.
 */
function encodeParamValue(value: string) {
  return value.replace(/\^/g, "^^").replace(/"/g, "^'").replace(/\r?\n/g, "^n");
}

function toContact<T extends { name: string; email: string }>(contact: T) {
  // Older participant records can carry surrounding spaces, which the library
  // rejects as an invalid email and fails the whole calendar.
  return {
    ...contact,
    name: encodeParamValue(contact.name),
    email: contact.email.trim(),
  };
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
    organizer: organizer ? toContact(organizer) : undefined,
    // A blank address would become an empty ATTENDEE line.
    attendees: attendees
      ?.filter((attendee) => attendee.email.trim() !== "")
      .map(toContact),
    // The library writes the value verbatim; RFC 5546 spells it uppercase,
    // matching the MIME method parameter nodemailer sends.
    method: method.toUpperCase(),
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
