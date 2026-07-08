import type { Prisma, ScheduledEventStatus } from "@rallly/database";
import { prisma } from "@rallly/database";
import { parseConferencing } from "@/features/conferencing/data";
import type { Conferencing } from "@/features/conferencing/schema";
import { parseLocation } from "@/features/location/data";
import type { Location } from "@/features/location/schema";
import {
  pastScheduledEventWhere,
  upcomingScheduledEventWhere,
} from "./predicates";
import type { Status } from "./schema";

export function getPublicScheduledEvent(id: string) {
  return prisma.scheduledEvent.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      conferencing: true,
      start: true,
      end: true,
      allDay: true,
      timeZone: true,
      status: true,
      deletedAt: true,
      capacity: true,
      hideAttendees: true,
      userId: true,
      spaceId: true,
    },
  });
}

// Live count of accepted registrations. Kept separate from the event read so
// the (stable) event can be cached while this churns on every RSVP, and so the
// capacity gate always sees a fresh count.
export function getEventAcceptedCount({ eventId }: { eventId: string }) {
  return prisma.scheduledEventInvite.count({
    where: { scheduledEventId: eventId, status: "accepted" },
  });
}

// A capped slice of accepted attendees for the avatar preview — never the full
// list, which is unbounded. Pair with getEventAcceptedCount for the total.
export async function getEventAttendeePreview({
  eventId,
  take,
}: {
  eventId: string;
  take: number;
}) {
  const invites = await prisma.scheduledEventInvite.findMany({
    where: { scheduledEventId: eventId, status: "accepted" },
    select: {
      id: true,
      inviteeName: true,
      user: { select: { image: true } },
    },
    orderBy: { createdAt: "asc" },
    take,
  });

  return invites.map((invite) => ({
    id: invite.id,
    name: invite.inviteeName,
    image: invite.user?.image ?? undefined,
  }));
}

// Looks up the current user's registration for an event, keyed by the user
// (real or anonymous) the invite is tied to. Returns the invite the public
// event page needs to render the "you're going" state, or null.
export function getEventRegistration({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) {
  return prisma.scheduledEventInvite.findFirst({
    where: {
      scheduledEventId: eventId,
      inviteeId: userId,
      status: { not: "pending" },
    },
    select: {
      uid: true,
      inviteeName: true,
      inviteeEmail: true,
    },
  });
}

export type ScheduledEventDTO = {
  id: string;
  title: string;
  description: string | null;
  location: Location | null;
  conferencing: Conferencing | null;
  start: Date;
  end: Date;
  allDay: boolean;
  timeZone: string | null;
  status: ScheduledEventStatus;
};

export function createScheduledEventDTO(event: {
  id: string;
  title: string;
  description: string | null;
  location: Prisma.JsonValue | null;
  conferencing: Prisma.JsonValue | null;
  start: Date;
  end: Date;
  allDay: boolean;
  timeZone: string | null;
  status: ScheduledEventStatus;
}): ScheduledEventDTO {
  const location = parseLocation(event.location, {
    scheduledEventId: event.id,
  });
  const conferencing = parseConferencing(event.conferencing, {
    scheduledEventId: event.id,
  });
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    location,
    conferencing,
    start: event.start,
    end: event.end,
    allDay: event.allDay,
    timeZone: event.timeZone,
    status: event.status,
  };
}

// Common event selection fields
const eventSelectFields = {
  id: true,
  title: true,
  description: true,
  location: true,
  conferencing: true,
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
  location: Prisma.JsonValue | null;
  conferencing: Prisma.JsonValue | null;
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
  const dto = createScheduledEventDTO(event);
  return {
    ...dto,
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
  spaceId,
  timeZone,
}: {
  search?: string;
  member?: string;
  page?: number;
  pageSize?: number;
  spaceId: string;
  timeZone: string;
}) => {
  const where: Prisma.ScheduledEventWhereInput = {
    ...buildBaseWhere(spaceId, search, member),
    ...upcomingScheduledEventWhere({ now: new Date(), timeZone }),
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
  spaceId,
  timeZone,
}: {
  search?: string;
  member?: string;
  page?: number;
  pageSize?: number;
  spaceId: string;
  timeZone: string;
}) => {
  const where: Prisma.ScheduledEventWhereInput = {
    ...buildBaseWhere(spaceId, search, member),
    ...pastScheduledEventWhere({ now: new Date(), timeZone }),
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
  spaceId,
}: {
  search?: string;
  member?: string;
  page?: number;
  pageSize?: number;
  spaceId: string;
}) => {
  const where: Prisma.ScheduledEventWhereInput = {
    ...buildBaseWhere(spaceId, search, member),
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
  spaceId,
}: {
  search?: string;
  member?: string;
  page?: number;
  pageSize?: number;
  spaceId: string;
}) => {
  const where: Prisma.ScheduledEventWhereInput = {
    ...buildBaseWhere(spaceId, search, member),
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
  spaceId,
  timeZone,
}: {
  status?: Status;
  search?: string;
  member?: string;
  page?: number;
  pageSize?: number;
  spaceId: string;
  timeZone: string;
}) => {
  const commonParams = { search, member, page, pageSize, spaceId };

  switch (status) {
    case "upcoming":
      return getUpcomingEvents({ ...commonParams, timeZone });
    case "past":
      return getPastEvents({ ...commonParams, timeZone });
    case "unconfirmed":
      return getUnconfirmedEvents(commonParams);
    case "canceled":
      return getCanceledEvents(commonParams);
    default:
      // If no status specified, default to upcoming
      return getUpcomingEvents({ ...commonParams, timeZone });
  }
};
