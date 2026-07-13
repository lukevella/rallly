"use server";

import { sendEventRsvpConfirmationEmail } from "@rallly/emails/templates/event-rsvp-confirmation";
import { createLogger } from "@rallly/logger";
import { headers } from "next/headers";
import { after } from "next/server";
import * as z from "zod";
import { getSpaceBranding } from "@/emails/branding";
import { parseConferencing } from "@/features/conferencing/data";
import { getConferencingUri } from "@/features/conferencing/utils";
import { parseLocation } from "@/features/location/data";
import { formatLocationText } from "@/features/location/utils";
import {
  getEventAcceptedCount,
  getPublicScheduledEvent,
  getScheduledEventRsvpEmailData,
} from "@/features/scheduled-event/data";
import { cancelRsvp, createRsvp } from "@/features/scheduled-event/mutations";
import {
  formatEventDateTime,
  getEventPhase,
  isEventFull,
} from "@/features/scheduled-event/utils";
import { getLocale } from "@/i18n/server/get-locale";
import { authLib, getSession } from "@/lib/auth";
import { getDeviceDateTimeConfig } from "@/lib/datetime/server";
import type { TimeFormat } from "@/lib/datetime/types";
import { AppError } from "@/lib/errors/app-error";
import { actionClient, authActionClient } from "@/lib/safe-action/server";
import { createIcsEvent } from "@/lib/utils/ics";

const logger = createLogger("scheduled-event");

// Re-validates the registration gate server-side — never trust that the client
// only offered registration when the event was actually open.
async function assertRegistrationOpen(eventId: string) {
  const event = await getPublicScheduledEvent(eventId);

  if (!event || event.deletedAt) {
    throw new AppError({ code: "NOT_FOUND", message: "Event not found" });
  }

  const phase = getEventPhase({
    status: event.status,
    start: event.start,
    end: event.end,
    now: new Date(),
  });

  if (phase !== "upcoming") {
    throw new AppError({
      code: "FORBIDDEN",
      message: "Registration is closed for this event",
    });
  }

  const acceptedCount = await getEventAcceptedCount({ eventId });

  if (isEventFull({ capacity: event.capacity, acceptedCount })) {
    throw new AppError({ code: "FORBIDDEN", message: "Event is full" });
  }
}

// Runs inside `after()` so the form response never waits on it. A missing
// event or a failed ICS build downgrades gracefully — the email still goes
// out, just without the attachment.
async function sendRsvpConfirmation({
  eventId,
  name,
  email,
  status,
  locale,
  timeZone,
  timeFormat,
}: {
  eventId: string;
  name: string;
  email: string;
  status: "accepted" | "declined";
  locale: string;
  timeZone?: string;
  timeFormat?: TimeFormat;
}) {
  const event = await getScheduledEventRsvpEmailData(eventId);

  if (!event) {
    return;
  }

  const location = parseLocation(event.location, {
    scheduledEventId: event.id,
  });
  const conferencing = parseConferencing(event.conferencing, {
    scheduledEventId: event.id,
  });
  const locationText = location ? formatLocationText(location) : undefined;
  const conferencingUri = conferencing
    ? getConferencingUri(conferencing)
    : undefined;

  const descriptionParts: string[] = [];
  if (event.description) {
    descriptionParts.push(event.description);
  }
  if (conferencingUri) {
    descriptionParts.push(conferencingUri);
  }

  const icsEvent = createIcsEvent({
    uid: event.uid,
    sequence: event.sequence,
    title: event.title,
    description:
      descriptionParts.length > 0 ? descriptionParts.join("\n\n") : undefined,
    location: locationText ?? conferencingUri,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    timeZone: event.timeZone ?? undefined,
    organizer: {
      name: event.user.name,
      email: event.user.email,
    },
    attendees: [
      {
        name,
        email,
        partstat: status === "accepted" ? "ACCEPTED" : "DECLINED",
      },
    ],
    method: "request",
    status: "CONFIRMED",
  });

  if (icsEvent.error) {
    logger.error(
      { error: icsEvent.error, eventId },
      "Failed to generate RSVP confirmation ICS",
    );
  }

  const { day, dow, date, time } = formatEventDateTime({
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    timeZone: event.timeZone,
    inviteeTimeZone: timeZone,
    locale,
    timeFormat,
  });

  await sendEventRsvpConfirmationEmail({
    to: email,
    locale,
    branding: await getSpaceBranding(event.space),
    ...(icsEvent.value
      ? {
          icalEvent: {
            filename: "invite.ics",
            method: "request" as const,
            content: icsEvent.value,
          },
        }
      : {}),
    props: {
      title: event.title,
      hostName: event.user.name,
      response: status,
      day,
      dow,
      date,
      time,
      location: locationText ?? conferencingUri,
    },
  });
}

export const submitRsvpAction = actionClient
  .metadata({ actionName: "submit_rsvp" })
  .inputSchema(
    z.object({
      eventId: z.string(),
      name: z.string().trim().min(1).max(100),
      email: z.email(),
      status: z.enum(["accepted", "declined"]),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { eventId, name, email, status } = parsedInput;

    await assertRegistrationOpen(eventId);

    // Tie the registration to a session so guests can manage it (e.g. cancel)
    // without an account. Reuse an existing session — anonymous or real —
    // otherwise create a fresh anonymous one.
    const session = await getSession();
    let inviteeId: string;
    if (session?.user) {
      inviteeId = session.user.id;
    } else {
      const { user } = await authLib.api.signInAnonymous({
        headers: await headers(),
      });
      inviteeId = user.id;
    }

    // Request APIs are unavailable inside after(), so resolve the invitee's
    // locale and zone here and pass them through.
    const [locale, { timeZone, timeFormat }] = await Promise.all([
      getLocale(),
      getDeviceDateTimeConfig(),
    ]);

    const result = await createRsvp({
      eventId,
      name,
      email,
      status,
      inviteeId,
      locale,
      timeZone,
    });

    if (result.ok) {
      after(() =>
        sendRsvpConfirmation({
          eventId,
          name,
          email,
          status,
          locale,
          timeZone,
          timeFormat,
        }),
      );
    }

    return result;
  });

export const registerForEventAction = authActionClient
  .metadata({ actionName: "register_for_event" })
  .inputSchema(z.object({ eventId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    const { eventId } = parsedInput;

    await assertRegistrationOpen(eventId);

    const [locale, { timeZone, timeFormat }] = await Promise.all([
      getLocale(),
      getDeviceDateTimeConfig(),
    ]);

    const result = await createRsvp({
      eventId,
      name: ctx.user.name,
      email: ctx.user.email,
      status: "accepted",
      inviteeId: ctx.user.id,
      locale,
      timeZone,
    });

    if (result.ok) {
      after(() =>
        sendRsvpConfirmation({
          eventId,
          name: ctx.user.name,
          email: ctx.user.email,
          status: "accepted",
          locale,
          timeZone,
          timeFormat,
        }),
      );
    }

    return result;
  });

export const cancelRsvpAction = actionClient
  .metadata({ actionName: "cancel_rsvp" })
  .inputSchema(
    z.object({
      // The invite uid is an unguessable token that acts as proof of
      // ownership, so the registrant can cancel without re-authenticating.
      inviteUid: z.string().min(1).max(255),
    }),
  )
  .action(async ({ parsedInput }) => {
    return await cancelRsvp({ inviteUid: parsedInput.inviteUid });
  });
