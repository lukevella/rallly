import * as ics from "ics";

import { wallTimeToInstant } from "@/lib/datetime/wall-time";

const productId = "-//Rallly//EN";

export interface CreateIcsEventOptions {
  uid: string;
  sequence?: number;
  start: Date;
  end: Date;
  allDay: boolean;
  timeZone?: string;
  /**
   * Where the attachment's recipient is. A floating time is anchored here and
   * sent as an instant, because Outlook reads a floating time in an invite as
   * UTC.
   */
  recipientTimeZone?: string | null;
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

const toWallTime = (date: Date) => date.toISOString().slice(0, 19);

// The attachment carries minutes, so ordering is decided at that precision.
const toMinute = (date: Date) => Math.floor(date.getTime() / 60_000);

function anchorFloatingTime({
  start,
  end,
  timeZone,
}: {
  start: Date;
  end: Date;
  timeZone: string;
}) {
  try {
    const anchoredStart = wallTimeToInstant(toWallTime(start), timeZone);
    const anchoredEnd = wallTimeToInstant(toWallTime(end), timeZone);
    // A start in a skipped hour moves forward and can overtake the end;
    // DTEND must stay after DTSTART, so keep the wall clock duration.
    return {
      start: anchoredStart,
      end:
        toMinute(anchoredEnd) > toMinute(anchoredStart)
          ? anchoredEnd
          : new Date(
              anchoredStart.getTime() + (end.getTime() - start.getTime()),
            ),
    };
  } catch {
    // An unknown zone makes Intl throw; floating is the honest fallback.
    return undefined;
  }
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
  recipientTimeZone,
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
  const anchored =
    !timeZone && !allDay && recipientTimeZone
      ? anchorFloatingTime({ start, end, timeZone: recipientTimeZone })
      : undefined;
  const { start: from, end: to } = anchored ?? { start, end };
  const utc = Boolean(timeZone) || Boolean(anchored);

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
    startInputType: utc ? "utc" : "local",
    startOutputType: utc ? "utc" : "local",
    ...(allDay
      ? {
          start: [
            from.getUTCFullYear(),
            from.getUTCMonth() + 1,
            from.getUTCDate(),
          ],
          end: [to.getUTCFullYear(), to.getUTCMonth() + 1, to.getUTCDate()],
        }
      : {
          start: [
            from.getUTCFullYear(),
            from.getUTCMonth() + 1,
            from.getUTCDate(),
            from.getUTCHours(),
            from.getUTCMinutes(),
          ],
          end: [
            to.getUTCFullYear(),
            to.getUTCMonth() + 1,
            to.getUTCDate(),
            to.getUTCHours(),
            to.getUTCMinutes(),
          ],
        }),
  });
}
