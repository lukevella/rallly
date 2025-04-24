import type { Prisma } from "@rallly/database";
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
  page = 1,
  pageSize = 10,
}: {
  userId: string;
  status: Status;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const now = new Date();

  const where: Prisma.ScheduledEventWhereInput = {
    userId,
    deletedAt: null,
    ...(status != "past" && { start: { gte: now } }),
    ...(status === "past" && { start: { lt: now } }),
    ...(search && { title: { contains: search, mode: "insensitive" } }),
    status: mapStatus[status],
  };

  const [rawEvents, totalCount] = await Promise.all([
    prisma.scheduledEvent.findMany({
      where,
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
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.scheduledEvent.count({ where }),
  ]);

  const events = rawEvents.map((event) => ({
    ...event,
    status:
      event.status === "confirmed"
        ? ((event.start < now ? "past" : "upcoming") as Status)
        : event.status,
    invites: event.invites.map((invite) => ({
      id: invite.id,
      inviteeName: invite.inviteeName,
      inviteeImage: invite.user?.image ?? undefined,
    })),
  }));

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page * pageSize < totalCount;

  return { events, totalCount, totalPages, hasNextPage };
}
