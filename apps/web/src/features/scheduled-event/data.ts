import type { Prisma, ScheduledEventStatus } from "@rallly/database";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { requireSpace } from "@/auth/data";
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

export const getScheduledEvents = async ({
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
  const space = await requireSpace();
  const where = getEventsWhereInput({
    spaceId: space.id,
    status,
    search,
  });

  const [rawEvents, totalCount] = await prisma.$transaction([
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
};

export const getUpcomingEventsCount = async () => {
  const space = await requireSpace();
  return prisma.scheduledEvent.count({
    where: getEventsWhereInput({
      spaceId: space.id,
      status: "upcoming",
    }),
  });
};

// Common event selection fields
const eventSelectFields = {
  id: true,
  title: true,
  description: true,
  location: true,
  start: true,
  end: true,
  allDay: true,
  timeZone: true,
  status: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
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
} as const;

// Type for raw event data from database
type RawEventData = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: Date;
  end: Date;
  allDay: boolean;
  timeZone: string | null;
  status: ScheduledEventStatus;
  userId: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  invites: Array<{
    id: string;
    inviteeName: string;
    user: {
      image: string | null;
    } | null;
  }>;
};

// Common event transformation function
function transformEvent(event: RawEventData) {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location: event.location,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    timeZone: event.timeZone,
    status: event.status,
    createdBy: {
      name: event.user.name,
      image: event.user.image ?? undefined,
    },
    invites: event.invites.map((invite) => ({
      id: invite.id,
      inviteeName: invite.inviteeName,
      inviteeImage: invite.user?.image ?? undefined,
    })),
  };
}

// Common base where clause builder
function buildBaseWhere(
  spaceId: string,
  search?: string,
  member?: string,
): Prisma.ScheduledEventWhereInput {
  const baseWhere: Prisma.ScheduledEventWhereInput = {
    spaceId,
    deletedAt: null,
  };

  if (search) {
    baseWhere.title = { contains: search, mode: "insensitive" };
  }

  if (member) {
    baseWhere.userId = member;
  }

  return baseWhere;
}

// Get upcoming events (confirmed events in the future)
export const getUpcomingEvents = async ({
  search,
  member,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  member?: string;
  page?: number;
  pageSize?: number;
}) => {
  const space = await requireSpace();
  const now = new Date();
  const todayStart = dayjs().startOf("day").utc().toDate();

  const where: Prisma.ScheduledEventWhereInput = {
    ...buildBaseWhere(space.id, search, member),
    status: "confirmed",
    OR: [
      { allDay: false, start: { gte: now } },
      { allDay: true, start: { gte: todayStart } },
    ],
  };

  const [totalCount, allEvents] = await prisma.$transaction([
    prisma.scheduledEvent.count({ where }),
    prisma.scheduledEvent.findMany({
      where,
      select: eventSelectFields,
      orderBy: [{ start: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const events = allEvents.map(transformEvent);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;

  return {
    events,
    total: totalCount,
    totalPages,
    hasNextPage,
    currentPage: page,
  };
};

// Get past events (confirmed events in the past)
export const getPastEvents = async ({
  search,
  member,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  member?: string;
  page?: number;
  pageSize?: number;
}) => {
  const space = await requireSpace();
  const now = new Date();
  const todayStart = dayjs().startOf("day").utc().toDate();

  const where: Prisma.ScheduledEventWhereInput = {
    ...buildBaseWhere(space.id, search, member),
    status: "confirmed",
    OR: [
      { allDay: false, start: { lt: now } },
      { allDay: true, start: { lt: todayStart } },
    ],
  };

  const [totalCount, allEvents] = await prisma.$transaction([
    prisma.scheduledEvent.count({ where }),
    prisma.scheduledEvent.findMany({
      where,
      select: eventSelectFields,
      orderBy: [{ start: "desc" }], // Past events: most recent first
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const events = allEvents.map(transformEvent);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;

  return {
    events,
    total: totalCount,
    totalPages,
    hasNextPage,
    currentPage: page,
  };
};

// Get unconfirmed events
export const getUnconfirmedEvents = async ({
  search,
  member,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  member?: string;
  page?: number;
  pageSize?: number;
}) => {
  const space = await requireSpace();

  const where: Prisma.ScheduledEventWhereInput = {
    ...buildBaseWhere(space.id, search, member),
    status: "unconfirmed",
  };

  const [totalCount, allEvents] = await prisma.$transaction([
    prisma.scheduledEvent.count({ where }),
    prisma.scheduledEvent.findMany({
      where,
      select: eventSelectFields,
      orderBy: [{ start: "asc" }], // Unconfirmed events: earliest first
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const events = allEvents.map(transformEvent);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;

  return {
    events,
    total: totalCount,
    totalPages,
    hasNextPage,
    currentPage: page,
  };
};

// Get canceled events
export const getCanceledEvents = async ({
  search,
  member,
  page = 1,
  pageSize = 20,
}: {
  search?: string;
  member?: string;
  page?: number;
  pageSize?: number;
}) => {
  const space = await requireSpace();

  const where: Prisma.ScheduledEventWhereInput = {
    ...buildBaseWhere(space.id, search, member),
    status: "canceled",
  };

  const [totalCount, allEvents] = await prisma.$transaction([
    prisma.scheduledEvent.count({ where }),
    prisma.scheduledEvent.findMany({
      where,
      select: eventSelectFields,
      orderBy: [{ start: "desc" }], // Canceled events: most recent first
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const events = allEvents.map(transformEvent);

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;

  return {
    events,
    total: totalCount,
    totalPages,
    hasNextPage,
    currentPage: page,
  };
};

// Main function that routes to specific loaders based on status
export const getEventsChronological = async ({
  status,
  search,
  member,
  page = 1,
  pageSize = 20,
}: {
  status?: Status;
  search?: string;
  member?: string;
  page?: number;
  pageSize?: number;
}) => {
  const commonParams = { search, member, page, pageSize };

  switch (status) {
    case "upcoming":
      return getUpcomingEvents(commonParams);
    case "past":
      return getPastEvents(commonParams);
    case "unconfirmed":
      return getUnconfirmedEvents(commonParams);
    case "canceled":
      return getCanceledEvents(commonParams);
    default:
      // If no status specified, default to upcoming
      return getUpcomingEvents(commonParams);
  }
};
