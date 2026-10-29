import "server-only";

import { Prisma, prisma } from "@rallly/database";
import { activeScheduledEventWhere } from "@/features/scheduled-event/utils";
import { emptyMemberContentSummary } from "@/features/space/member/constants";
import type {
  MemberContentSummary,
  MemberDTO,
  MemberInviteDTO,
} from "@/features/space/member/types";
import type { AuthorizedSpaceId } from "@/features/space/types";
import { fromDBRole } from "@/features/space/utils";

export async function getInvite(inviteId: string) {
  return prisma.spaceMemberInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      spaceId: true,
    },
  });
}

export async function listSpaceMembers({
  spaceId,
}: {
  spaceId: AuthorizedSpaceId;
}) {
  const members = await prisma.spaceMember.findMany({
    where: {
      spaceId,
    },
    select: {
      id: true,
      userId: true,
      role: true,
      spaceId: true,
      space: {
        select: {
          ownerId: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return members.map(
    (member) =>
      ({
        id: member.id,
        userId: member.userId,
        spaceId: member.spaceId,
        name: member.user.name,
        email: member.user.email,
        image: member.user.image ?? undefined,
        role: fromDBRole(member.role),
        isOwner: member.userId === member.space.ownerId,
      }) satisfies MemberDTO,
  );
}

export async function listSpaceInvites({
  spaceId,
}: {
  spaceId: AuthorizedSpaceId;
}) {
  const invites = await prisma.spaceMemberInvite.findMany({
    where: {
      spaceId,
    },
    select: {
      id: true,
      email: true,
      spaceId: true,
      role: true,
      invitedBy: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return invites.map(
    (invite) =>
      ({
        ...invite,
        role: fromDBRole(invite.role),
      }) satisfies MemberInviteDTO,
  );
}

export async function getSpaceMemberByEmail({
  spaceId,
  email,
}: {
  spaceId: AuthorizedSpaceId;
  email: string;
}) {
  return prisma.spaceMember.findFirst({
    where: {
      spaceId,
      user: { email },
    },
    select: {
      userId: true,
    },
  });
}

/**
 * What each member created in the space, keyed by user id. Covers the whole
 * space whatever the collaboration setting: the admin removing someone
 * decides what happens to all of it. Active events are classified against
 * the viewer's present, so the caller supplies the zone.
 */
export async function listMemberContentSummaries({
  spaceId,
  now,
  timeZone,
}: {
  spaceId: AuthorizedSpaceId;
  now: Date;
  timeZone: string;
}) {
  const activeEvent = activeScheduledEventWhere({ now, timeZone });

  const [
    polls,
    activeEvents,
    finishedEvents,
    videoCallEvents,
    eventTypes,
    sheets,
  ] = await Promise.all([
    prisma.poll.groupBy({
      by: ["userId", "status"],
      where: { spaceId, deleted: false, userId: { not: null } },
      _count: { _all: true },
    }),
    prisma.scheduledEvent.groupBy({
      by: ["userId"],
      where: { spaceId, ...activeEvent },
      _count: { _all: true },
    }),
    prisma.scheduledEvent.groupBy({
      by: ["userId"],
      where: { spaceId, deletedAt: null, NOT: activeEvent },
      _count: { _all: true },
    }),
    prisma.scheduledEvent.groupBy({
      by: ["userId"],
      where: {
        spaceId,
        ...activeEvent,
        conferencing: { not: Prisma.AnyNull },
      },
      _count: { _all: true },
    }),
    prisma.eventType.groupBy({
      by: ["hostId"],
      where: { spaceId, deleted: false },
      _count: { _all: true },
    }),
    prisma.sheet.groupBy({
      by: ["hostId"],
      where: { spaceId, deleted: false },
      _count: { _all: true },
    }),
  ]);

  const summaries = new Map<string, MemberContentSummary>();
  const summaryFor = (userId: string) => {
    let summary = summaries.get(userId);
    if (!summary) {
      summary = structuredClone(emptyMemberContentSummary);
      summaries.set(userId, summary);
    }
    return summary;
  };

  for (const row of polls) {
    if (!row.userId) {
      continue;
    }
    const summary = summaryFor(row.userId);
    if (row.status === "open") {
      summary.active.polls += row._count._all;
    } else {
      summary.finished.polls += row._count._all;
    }
  }
  for (const row of activeEvents) {
    summaryFor(row.userId).active.events = row._count._all;
  }
  for (const row of finishedEvents) {
    summaryFor(row.userId).finished.events = row._count._all;
  }
  for (const row of videoCallEvents) {
    summaryFor(row.userId).activeEventsWithVideoCall = row._count._all;
  }
  for (const row of eventTypes) {
    summaryFor(row.hostId).active.eventTypes = row._count._all;
  }
  for (const row of sheets) {
    summaryFor(row.hostId).active.sheets = row._count._all;
  }

  return summaries;
}
