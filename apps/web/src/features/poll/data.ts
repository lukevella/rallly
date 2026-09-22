import "server-only";

import type { PollStatus, Prisma, VoteType } from "@rallly/database";
import { prisma } from "@rallly/database";
import { shortUrl } from "@rallly/utils/absolute-url";
import { getInstancePolicy } from "@/features/instance-policy/data";
import { VOTE_TYPES } from "@/features/poll/constants";
import type {
  PollComment,
  PollDetails,
  PollUnavailableReason,
} from "@/features/poll/types";
import { isLegacyEditToken } from "@/features/poll/utils";
import { effectiveSpaceMemberWhere } from "@/features/space/member/utils";
import type {
  AuthorizedSpaceId,
  SpaceContentScope,
} from "@/features/space/types";
import {
  isSpaceAttributionHidden,
  isSpaceBrandingActive,
} from "@/features/space/utils";
import { decryptToken } from "@/lib/session";

export async function getPoll({
  pollId,
  scope,
}: {
  pollId: string;
  scope: SpaceContentScope;
}) {
  return prisma.poll.findFirst({
    where: {
      id: pollId,
      spaceId: scope.spaceId,
      ...(scope.createdBy && { userId: scope.createdBy }),
      deleted: false,
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });
}

export async function getPollResults({
  pollId,
  spaceId,
}: {
  pollId: string;
  spaceId: AuthorizedSpaceId;
}) {
  // Run poll query and vote aggregation in parallel
  const [poll, voteCounts] = await Promise.all([
    prisma.poll.findFirst({
      where: {
        id: pollId,
        spaceId,
        deleted: false,
      },
      select: {
        id: true,
        kind: true,
        status: true,
        options: {
          select: {
            id: true,
            startTime: true,
            duration: true,
          },
          orderBy: {
            startTime: "asc",
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    }),
    prisma.vote.groupBy({
      by: ["optionId", "type"],
      where: {
        pollId,
      },
      _count: true,
    }),
  ]);

  if (!poll) {
    return null;
  }

  const countsByOption = new Map<string, Partial<Record<VoteType, number>>>();

  for (const row of voteCounts) {
    let counts = countsByOption.get(row.optionId);
    if (!counts) {
      counts = {};
      countsByOption.set(row.optionId, counts);
    }
    counts[row.type] = row._count;
  }

  // Ranking: total availability (yes + ifNeedBe) is primary, yes votes break
  // ties. The formula is internal; the API documents score as opaque.
  const optionResults = poll.options.map((option) => {
    const counts = countsByOption.get(option.id) ?? {};
    // Dense: every vote type is present, in display order, zero included.
    const votes = VOTE_TYPES.map((type) => ({
      type,
      count: counts[type] ?? 0,
    }));
    const score =
      ((counts.yes ?? 0) + (counts.ifNeedBe ?? 0)) * 1000 + (counts.yes ?? 0);

    return {
      id: option.id,
      startTime: option.startTime,
      duration: option.duration,
      votes,
      score,
    };
  });

  // Find the high score
  const highScore = Math.max(...optionResults.map((o) => o.score), 0);

  // Add isTopChoice flag
  const options = optionResults.map((option) => ({
    ...option,
    isTopChoice: option.score === highScore && option.score > 0,
  }));

  return {
    pollId: poll.id,
    kind: poll.kind,
    status: poll.status,
    participantCount: poll._count.participants,
    options,
    highScore,
  };
}

/**
 * Every participant in response order (oldest first).
 */
// Votes with their option's time, for the availability conversion.
const apiParticipantSelect = {
  id: true,
  name: true,
  email: true,
  createdAt: true,
  votes: {
    select: {
      type: true,
      option: { select: { startTime: true, duration: true } },
    },
  },
} satisfies Prisma.ParticipantSelect;

export async function getPollParticipants({
  pollId,
  spaceId,
}: {
  pollId: string;
  spaceId: AuthorizedSpaceId;
}) {
  const poll = await prisma.poll.findFirst({
    where: {
      id: pollId,
      spaceId,
      deleted: false,
    },
    select: {
      id: true,
      kind: true,
      participants: {
        select: apiParticipantSelect,
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      },
    },
  });

  if (!poll) {
    return null;
  }

  return {
    pollId: poll.id,
    kind: poll.kind,
    participants: poll.participants,
  };
}

/**
 * One participant of a poll. Distinguishes a missing poll from a missing
 * participant so the API can say which, and never returns a participant
 * from another poll: the participant filter is nested under the poll's own
 * scope check.
 */
export async function getPollParticipant({
  pollId,
  participantId,
  spaceId,
}: {
  pollId: string;
  participantId: string;
  spaceId: AuthorizedSpaceId;
}) {
  const poll = await prisma.poll.findFirst({
    where: {
      id: pollId,
      spaceId,
      deleted: false,
    },
    select: {
      id: true,
      kind: true,
      participants: {
        where: { id: participantId },
        select: apiParticipantSelect,
      },
    },
  });

  if (!poll) {
    return { poll: null, participant: null };
  }

  return {
    poll: { id: poll.id, kind: poll.kind },
    participant: poll.participants[0] ?? null,
  };
}

export async function listPolls({
  spaceId,
  status,
  cursor,
  limit,
}: {
  spaceId: AuthorizedSpaceId;
  status?: PollStatus;
  cursor?: string;
  limit: number;
}) {
  // Fetch one extra row to determine whether there is a next page
  const polls = await prisma.poll.findMany({
    where: {
      spaceId,
      deleted: false,
      ...(status && { status }),
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      timeZone: true,
      status: true,
      kind: true,
      createdAt: true,
      updatedAt: true,
      requireParticipantEmail: true,
      hideParticipants: true,
      hideScores: true,
      disableComments: true,
      allowTentativeVotes: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      options: {
        select: {
          id: true,
          startTime: true,
          duration: true,
        },
        orderBy: {
          startTime: "asc",
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  const hasMore = polls.length > limit;
  const page = hasMore ? polls.slice(0, limit) : polls;

  return {
    polls: page.map(({ _count, ...poll }) => ({
      ...poll,
      participantCount: _count.participants,
    })),
    nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
  };
}

type PollFilters = {
  status?: PollStatus;
  page?: number;
  pageSize?: number;
  q?: string;
  member?: string;
  scope: SpaceContentScope;
};

export const getPolls = async ({
  status,
  q,
  member,
  page = 1,
  pageSize = 20,
  scope,
}: PollFilters) => {
  // The scope restriction and the member filter both apply: a restricted
  // member asking for someone else's polls gets an empty result.
  const creatorIds = [scope.createdBy, member].filter((id): id is string =>
    Boolean(id),
  );

  // Build the where clause based on filters
  const where: Prisma.PollWhereInput = {
    spaceId: scope.spaceId,
    deletedAt: null,
    ...(status && { status }),
    ...(q && { title: { contains: q, mode: "insensitive" } }),
    ...(creatorIds.length > 0 && {
      AND: creatorIds.map((userId) => ({ userId })),
    }),
  };

  // Get total count and paginated polls in a transaction
  const [totalCount, polls] = await prisma.$transaction([
    prisma.poll.count({ where }),
    prisma.poll.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        closedReason: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        participants: {
          select: {
            id: true,
            name: true,
            user: {
              select: {
                image: true,
              },
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  const transformedPolls = polls.map((poll) => ({
    id: poll.id,
    title: poll.title,
    status: poll.status,
    closedReason: poll.closedReason,
    createdAt: poll.createdAt,
    updatedAt: poll.updatedAt,
    user: poll.user
      ? {
          id: poll.user.id,
          name: poll.user.name,
          image: poll.user.image,
        }
      : null,
    participants: poll.participants.map((participant) => ({
      id: participant.id,
      name: participant.name,
      image: participant.user?.image ?? undefined,
    })),
  }));

  const totalPages = Math.ceil(totalCount / pageSize);
  const hasNextPage = page < totalPages;

  return {
    polls: transformedPolls,
    total: totalCount,
    totalPages,
    hasNextPage,
    currentPage: page,
  };
};

export const getPollStatusCounts = async ({
  scope,
}: {
  scope: SpaceContentScope;
}) => {
  const res = await prisma.poll.groupBy({
    by: ["status"],
    where: {
      spaceId: scope.spaceId,
      ...(scope.createdBy && { userId: scope.createdBy }),
      deletedAt: null,
    },
    _count: {
      status: true,
    },
  });

  const counts: Record<PollStatus, number> = {
    open: 0,
    closed: 0,
    scheduled: 0,
    canceled: 0,
  };

  for (const { status, _count } of res) {
    counts[status] = _count.status;
  }

  return counts;
};

export async function canUserManagePoll(
  user: {
    id: string;
    isGuest: boolean;
  },
  poll: {
    userId?: string | null;
    spaceId?: string | null;
    deleted?: boolean;
  },
) {
  if (poll.deleted) {
    // A deleted poll cannot be managed by anyone
    return false;
  }

  if (poll.userId && poll.userId === user.id) {
    // user is owner
    return true;
  }

  if (poll.spaceId) {
    const membership = await prisma.spaceMember.findFirst({
      where: {
        spaceId: poll.spaceId,
        ...effectiveSpaceMemberWhere({ userId: user.id }),
      },
      select: {
        space: { select: { shared: true } },
      },
    });

    const { spacesAlwaysShared } = await getInstancePolicy();

    if (membership && (spacesAlwaysShared || membership.space.shared)) {
      // Members manage each other's polls only in a shared space. Uniform
      // across roles: admins are members here too.
      return true;
    }
  }

  return false;
}

export const hasPollAdminAccess = async (pollId: string, userId: string) => {
  const { spacesAlwaysShared } = await getInstancePolicy();

  const poll = await prisma.poll.findFirst({
    where: {
      id: pollId,
      deleted: false,
      OR: [
        { userId: userId },
        // Members reach each other's polls only in a shared space. Uniform
        // across roles: admins are members here too.
        {
          space: {
            // The row is not coerced the way the DTO is, so the policy has
            // to override it here
            ...(spacesAlwaysShared ? {} : { shared: true }),
            members: { some: effectiveSpaceMemberWhere({ userId }) },
          },
        },
      ],
    },
    select: {
      id: true,
    },
  });

  return poll !== null;
};

export async function getParticipant({
  participantId,
}: {
  participantId: string;
}) {
  return prisma.participant.findFirst({
    where: { id: participantId },
    select: {
      id: true,
      pollId: true,
      userId: true,
      poll: { select: { status: true, deleted: true } },
    },
  });
}

/**
 * The responses an emailed link may edit. A response token names exactly one
 * row. A legacy seal names a guest user instead, so it resolves to that
 * user's responses in the poll that carry an email, the only rows such a
 * link was ever sent for.
 */
export async function listParticipantIdsByToken({
  pollId,
  token,
}: {
  pollId: string;
  token: string;
}) {
  if (isLegacyEditToken(token)) {
    const payload = await decryptToken<{ userId: string }>(token).catch(
      () => null,
    );
    if (!payload?.userId) {
      return [];
    }
    const participants = await prisma.participant.findMany({
      where: {
        pollId,
        userId: payload.userId,
        email: { not: null },
      },
      select: { id: true },
    });
    return participants.map((participant) => participant.id);
  }

  const participant = await prisma.participant.findFirst({
    where: { pollId, token },
    select: { id: true },
  });
  return participant ? [participant.id] : [];
}

export async function getPollWithOptions({
  pollId,
  spaceId,
}: {
  pollId: string;
  spaceId: AuthorizedSpaceId;
}) {
  const poll = await prisma.poll.findFirst({
    where: {
      id: pollId,
      spaceId,
      deleted: false,
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      timeZone: true,
      status: true,
      kind: true,
      createdAt: true,
      updatedAt: true,
      requireParticipantEmail: true,
      hideParticipants: true,
      hideScores: true,
      disableComments: true,
      allowTentativeVotes: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      options: {
        select: {
          id: true,
          startTime: true,
          duration: true,
        },
        orderBy: {
          startTime: "asc",
        },
      },
      _count: {
        select: {
          participants: true,
        },
      },
    },
  });

  if (!poll) {
    return null;
  }

  const { _count, ...rest } = poll;
  return { ...rest, participantCount: _count.participants };
}

/**
 * Whether a poll can be served at all, and why not. A poll that exists but
 * must not be shown gets its own page instead of a 404: the viewer of a
 * banned creator's poll is usually a scam target and needs to be told so,
 * and a deleted poll's viewer deserves better than "page not found". The
 * space owner counts as a creator too: an API key holder can organize polls
 * under any member, and banning the payer must take every link in the
 * space down with it.
 */
export async function getPollAvailability({ pollId }: { pollId: string }) {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      id: true,
      title: true,
      deleted: true,
      user: { select: { name: true, banned: true } },
      space: { select: { owner: { select: { banned: true } } } },
    },
  });

  if (!poll) {
    return null;
  }

  const unavailable: PollUnavailableReason | null = poll.deleted
    ? "deleted"
    : poll.user?.banned || poll.space?.owner.banned
      ? "removed"
      : null;

  return {
    id: poll.id,
    title: poll.title,
    authorName: poll.user?.name || "Guest",
    unavailable,
  };
}

/**
 * The poll as both the invite page and the admin page show it. Null for a
 * missing poll, a deleted one, or a banned creator's: all three are treated
 * as if the poll never existed, for everyone including its owner. The space
 * owner counts as a creator, as in getPollAvailability.
 */
export async function getPollDetails({
  pollId,
}: {
  pollId: string;
}): Promise<PollDetails | null> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: {
      id: true,
      timeZone: true,
      title: true,
      location: true,
      description: true,
      createdAt: true,
      status: true,
      closedReason: true,
      hideParticipants: true,
      disableComments: true,
      allowTentativeVotes: true,
      hideScores: true,
      requireParticipantEmail: true,
      muted: true,
      userId: true,
      spaceId: true,
      deleted: true,
      options: {
        select: { id: true, startTime: true, duration: true },
        orderBy: { startTime: "asc" },
      },
      user: { select: { id: true, name: true, image: true, banned: true } },
      space: {
        select: {
          name: true,
          image: true,
          tier: true,
          showBranding: true,
          hideAttribution: true,
          primaryColor: true,
          owner: { select: { banned: true } },
        },
      },
      scheduledEvent: {
        select: {
          id: true,
          start: true,
          end: true,
          allDay: true,
          status: true,
        },
      },
    },
  });

  if (!poll || poll.deleted || poll.user?.banned || poll.space?.owner.banned) {
    return null;
  }

  const { spaceBrandingAllowed, spaceAttributionConfigurable } =
    await getInstancePolicy();
  const brandingActive = poll.space
    ? isSpaceBrandingActive({ ...poll.space, spaceBrandingAllowed })
    : false;

  const {
    scheduledEvent,
    deleted: _deleted,
    user,
    space,
    ...pollFields
  } = poll;

  return {
    ...pollFields,
    user: user ? { id: user.id, name: user.name, image: user.image } : null,
    space: space
      ? {
          name: space.name,
          image: space.image,
          tier: space.tier,
          showBranding: brandingActive,
          primaryColor: brandingActive ? space.primaryColor : null,
          hideAttribution: isSpaceAttributionHidden({
            ...space,
            spaceAttributionConfigurable,
          }),
        }
      : null,
    event: scheduledEvent
      ? {
          id: scheduledEvent.id,
          start: scheduledEvent.start,
          duration: scheduledEvent.allDay
            ? 0
            : Math.round(
                (scheduledEvent.end.getTime() -
                  scheduledEvent.start.getTime()) /
                  60_000,
              ),
          status: scheduledEvent.status,
        }
      : null,
    inviteLink: shortUrl(`/invite/${poll.id}`),
  };
}

/**
 * Every response with its votes and edit token. Callers scope the output to
 * the viewer before it leaves the server: the token is the edit credential
 * and notes are for the host and their author only.
 */
export async function listPollParticipants({ pollId }: { pollId: string }) {
  const participants = await prisma.participant.findMany({
    where: { pollId },
    select: {
      id: true,
      name: true,
      email: true,
      userId: true,
      note: true,
      token: true,
      createdAt: true,
      votes: { select: { optionId: true, type: true } },
      user: { select: { image: true } },
    },
    orderBy: [{ createdAt: "desc" }, { name: "desc" }],
  });

  return participants.map(({ user, ...participant }) => ({
    ...participant,
    image: user?.image ?? null,
  }));
}

export async function listPollComments({
  pollId,
}: {
  pollId: string;
}): Promise<PollComment[]> {
  return prisma.comment.findMany({
    where: { pollId },
    select: {
      id: true,
      content: true,
      authorName: true,
      userId: true,
      createdAt: true,
    },
    orderBy: [{ createdAt: "asc" }],
  });
}
