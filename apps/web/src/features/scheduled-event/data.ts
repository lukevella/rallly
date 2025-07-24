import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { cache } from "react";
import { requireUserWithSpace } from "@/auth/data";
import type { Status } from "./schema";

dayjs.extend(utc);

const mapStatus = {
  upcoming: "confirmed",
  unconfirmed: "unconfirmed",
  past: "confirmed",
  canceled: "canceled",
} as const;

function getEventsWhereInput({
  spaceId,
  status,
  search,
}: {
  spaceId: string;
  status: Status;
  search?: string;
}) {
  const now = new Date();

  const todayStart = dayjs().startOf("day").utc().toDate();

  const where: Prisma.ScheduledEventWhereInput = {
    spaceId,
    deletedAt: null,
    ...(status === "upcoming" && {
      OR: [
        { allDay: false, start: { gte: now } },
        { allDay: true, start: { gte: todayStart } },
      ],
    }),
    ...(status === "past" && {
      OR: [
        { allDay: false, start: { lt: now } },
        { allDay: true, start: { lt: todayStart } },
      ],
    }),
    ...(search && { title: { contains: search, mode: "insensitive" } }),
    status: mapStatus[status],
  };

  return where;
}

export const loadScheduledEvents = cache(
  async ({
    status,
    search,
    page = 1,
    pageSize = 10,
  }: {
    status: Status;
    search?: string;
    page?: number;
    pageSize?: number;
  }) => {
    const { space } = await requireUserWithSpace();
    const where = getEventsWhereInput({
      spaceId: space.id,
      status,
      search,
    });

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
      invites: event.invites.map((invite) => ({
        id: invite.id,
        inviteeName: invite.inviteeName,
        inviteeImage: invite.user?.image ?? undefined,
      })),
    }));

    const totalPages = Math.ceil(totalCount / pageSize);
    const hasNextPage = page * pageSize < totalCount;

    return { events, totalCount, totalPages, hasNextPage };
  },
);

export const loadUpcomingEventsCount = cache(async () => {
  const { space } = await requireUserWithSpace();
  return prisma.scheduledEvent.count({
    where: getEventsWhereInput({
      spaceId: space.id,
      status: "upcoming",
    }),
  });
});
