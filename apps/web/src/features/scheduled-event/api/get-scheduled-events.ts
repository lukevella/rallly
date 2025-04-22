import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import type { Status } from "../schema";

dayjs.extend(utc);
dayjs.extend(timezone);

const mapStatus = {
  upcoming: "confirmed",
  unconfirmed: "unconfirmed",
  past: undefined,
  canceled: "canceled",
} as const;

export async function getScheduledEvents({
  userId,
  status,
  search,
}: {
  userId: string;
  status: Status;
  search?: string;
}) {
  const now = new Date();

  const rawEvents = await prisma.scheduledEvent.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(status != "past" && { start: { gte: now } }),
      ...(status === "past" && { start: { lt: now } }),
      ...(search && { title: { contains: search, mode: "insensitive" } }),
      status: mapStatus[status],
    },
    orderBy: {
      start: status === "past" ? "desc" : "asc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      start: true,
      end: true,
      allDay: true,
      timeZone: true,
      status: true,
      invites: {
        select: {
          id: true,
          inviteeName: true,
          user: {
            select: {
              image: true,
            },
          },
        },
      },
    },
  });

  const events = rawEvents.map((event) => ({
    ...event,
    status:
      event.status === "confirmed"
        ? // If the event is confirmed, it's either past or upcoming
          event.start < now
          ? "past"
          : "upcoming"
        : event.status,
    invites: event.invites.map((invite) => ({
      id: invite.id,
      inviteeName: invite.inviteeName,
      inviteeImage: invite.user?.image ?? undefined,
    })),
  }));

  const groupedEvents = events.reduce<
    Record<string, Array<(typeof events)[number]>>
  >((acc, event) => {
    const dateKey = dayjs(event.start).startOf("day").toISOString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  const groupedEventsArray = Object.keys(groupedEvents)
    .sort((a, b) =>
      status === "past" ? b.localeCompare(a) : a.localeCompare(b),
    )
    .map((dateKey) => ({
      date: dateKey,
      events: groupedEvents[dateKey],
    }));

  return groupedEventsArray;
}
