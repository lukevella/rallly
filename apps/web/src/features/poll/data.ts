import type { PollStatus, Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { shortUrl } from "@rallly/utils/absolute-url";
import { requireSpace } from "@/auth/data";

export async function getPollResults({
  pollId,
  spaceId,
}: {
  pollId: string;
  spaceId: string;
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
            participants: {
              where: { deleted: false },
            },
          },
        },
      },
    }),
    prisma.vote.groupBy({
      by: ["optionId", "type"],
      where: {
        pollId,
        participant: { deleted: false },
      },
      _count: true,
    }),
  ]);

  if (!poll) {
    return null;
  }

  // Build vote counts map from groupBy results
  const votesByOption = new Map<
    string,
    Array<{ type: string; count: number }>
  >();

  for (const row of voteCounts) {
    let votes = votesByOption.get(row.optionId);
    if (!votes) {
      votes = [];
      votesByOption.set(row.optionId, votes);
    }
    votes.push({ type: row.type, count: row._count });
  }

  // Helper to get count for a specific vote type
  const getCount = (
    votes: Array<{ type: string; count: number }>,
    type: string,
  ) => votes.find((v) => v.type === type)?.count ?? 0;

  // Calculate scores for each option
  // Ranking: total availability (yes + ifNeedBe) is primary, yes votes as tiebreaker
  // Score formula: (yes + ifNeedBe) * 1000 + yes
  const optionResults = poll.options.map((option) => {
    const votes = votesByOption.get(option.id) ?? [];
    const yesCount = getCount(votes, "yes");
    const ifNeedBeCount = getCount(votes, "ifNeedBe");
    const score = (yesCount + ifNeedBeCount) * 1000 + yesCount;

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
    participantCount: poll._count.participants,
    options,
    highScore,
  };
}

export async function getPollParticipants({
  pollId,
  spaceId,
}: {
  pollId: string;
  spaceId: string;
}) {
  const poll = await prisma.poll.findFirst({
    where: {
      id: pollId,
      spaceId,
      deleted: false,
    },
    select: {
      id: true,
      participants: {
        where: { deleted: false },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!poll) {
    return null;
  }

  return {
    pollId: poll.id,
    participants: poll.participants,
  };
}

type PollFilters = {
  status?: PollStatus;
  page?: number;
  pageSize?: number;
  q?: string;
  member?: string;
};

export const getPolls = async ({
  status,
  q,
  member,
  page = 1,
  pageSize = 20,
}: PollFilters) => {
  const space = await requireSpace();

  // Build the where clause based on filters
  const where: Prisma.PollWhereInput = {
    spaceId: space.id,
    deletedAt: null,
    ...(status && { status }),
    ...(q && { title: { contains: q, mode: "insensitive" } }),
    ...(member && { userId: member }),
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
          where: {
            deletedAt: null,
          },
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
    inviteLink: shortUrl(`/invite/${poll.id}`),
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
