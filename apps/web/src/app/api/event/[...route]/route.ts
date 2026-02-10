import { prisma } from "@rallly/database";
import type { CalendarEvent } from "calendar-link";
import { google, office365, outlook, yahoo } from "calendar-link";
import { Hono } from "hono";
import { handle } from "hono/vercel";

import { createIcsEvent } from "@/utils/ics";

const app = new Hono().basePath("/api/event");

async function getScheduledEvent(eventId: string) {
  return prisma.scheduledEvent.findUnique({
    where: { id: eventId },
    select: {
      uid: true,
      title: true,
      description: true,
      location: true,
      start: true,
      end: true,
      allDay: true,
      timeZone: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });
}

function toCalendarEvent(
  event: NonNullable<Awaited<ReturnType<typeof getScheduledEvent>>>,
): CalendarEvent {
  return {
    title: event.title,
    description: event.description ?? undefined,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    location: event.location ?? undefined,
    organizer: { name: event.user.name, email: event.user.email },
    busy: true,
  };
}

app.get("/:eventId/google-calendar", async (c) => {
  const event = await getScheduledEvent(c.req.param("eventId"));
  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }
  return c.redirect(google(toCalendarEvent(event)));
});

app.get("/:eventId/outlook", async (c) => {
  const event = await getScheduledEvent(c.req.param("eventId"));
  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }
  return c.redirect(outlook(toCalendarEvent(event)));
});

app.get("/:eventId/office365", async (c) => {
  const event = await getScheduledEvent(c.req.param("eventId"));
  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }
  return c.redirect(office365(toCalendarEvent(event)));
});

app.get("/:eventId/yahoo", async (c) => {
  const event = await getScheduledEvent(c.req.param("eventId"));
  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }
  return c.redirect(yahoo(toCalendarEvent(event)));
});

app.get("/:eventId/ics", async (c) => {
  const event = await getScheduledEvent(c.req.param("eventId"));
  if (!event) {
    return c.json({ error: "Event not found" }, 404);
  }

  const { error, value } = createIcsEvent({
    uid: event.uid,
    title: event.title,
    description: event.description ?? undefined,
    location: event.location ?? undefined,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    timeZone: event.timeZone ?? undefined,
    organizer: { name: event.user.name, email: event.user.email },
    method: "publish",
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
