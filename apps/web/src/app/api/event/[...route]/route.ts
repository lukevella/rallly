import type { CalendarEvent } from "calendar-link";
import { google, office365, outlook, yahoo } from "calendar-link";
import { Hono } from "hono";
import { handle } from "hono/vercel";

import { parseConferencing } from "@/features/conferencing/data";
import { getConferencingUri } from "@/features/conferencing/utils";
import { parseLocation } from "@/features/location/data";
import { formatLocationText } from "@/features/location/utils";
import { getScheduledEventCalendarData } from "@/features/scheduled-event/data";
import { createRatelimit } from "@/lib/rate-limit";
import { createIcsEvent } from "@/lib/utils/ics";

const app = new Hono().basePath("/api/event");

// These routes are unauthenticated by design: an event's calendar links are
// handed to invitees who have no account, exactly like the public /e/[id]
// page. The event id is the only credential and the ICS carries the host's
// address, so the budget bounds what a leaked or guessed id is worth in bulk.
// A real attendee adds an event to their calendar once.
const ratelimit = createRatelimit(60, "1 h");

type ScheduledEventRow = NonNullable<
  Awaited<ReturnType<typeof getScheduledEventCalendarData>>
>;

// Flattens structured location/conferencing into the single-string fields the
// calendar-link / ICS libraries accept.
function buildCalendarFields(event: ScheduledEventRow) {
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
  const description =
    descriptionParts.length > 0 ? descriptionParts.join("\n\n") : undefined;

  return {
    location: locationText ?? conferencingUri,
    description,
  };
}

function toCalendarEvent(event: ScheduledEventRow): CalendarEvent {
  const { location, description } = buildCalendarFields(event);
  return {
    title: event.title,
    description,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    location,
    organizer: { name: event.user.name, email: event.user.email },
    busy: true,
  };
}

app.use("/:eventId/*", async (c, next) => {
  if (ratelimit) {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    const { success } = await ratelimit.limit(`api:event:${ip || "unknown"}`);
    if (!success) {
      return c.json({ error: "Too many requests" }, 429);
    }
  }
  return next();
});

app.get("/:eventId/google-calendar", async (c) => {
  const event = await getScheduledEventCalendarData(c.req.param("eventId"));
  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }
  return c.redirect(google(toCalendarEvent(event)));
});

app.get("/:eventId/outlook", async (c) => {
  const event = await getScheduledEventCalendarData(c.req.param("eventId"));
  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }
  return c.redirect(outlook(toCalendarEvent(event)));
});

app.get("/:eventId/office365", async (c) => {
  const event = await getScheduledEventCalendarData(c.req.param("eventId"));
  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }
  return c.redirect(office365(toCalendarEvent(event)));
});

app.get("/:eventId/yahoo", async (c) => {
  const event = await getScheduledEventCalendarData(c.req.param("eventId"));
  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }
  return c.redirect(yahoo(toCalendarEvent(event)));
});

app.get("/:eventId/ics", async (c) => {
  const event = await getScheduledEventCalendarData(c.req.param("eventId"));
  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }

  const { location, description } = buildCalendarFields(event);

  const { error, value } = createIcsEvent({
    uid: event.uid,
    // Carries the event's revision so a re-download supersedes the copy
    // already in the client's calendar instead of being dropped as not-newer.
    sequence: event.sequence,
    title: event.title,
    description,
    location,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    timeZone: event.timeZone ?? undefined,
    organizer: { name: event.user.name, email: event.user.email },
    method: "publish",
    status: event.status === "canceled" ? "CANCELLED" : "CONFIRMED",
  });

  if (error || !value) {
    return c.json({ error: "Failed to generate ICS file" }, 500);
  }

  return new Response(value, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="event.ics"`,
    },
  });
});

export const GET = handle(app);
