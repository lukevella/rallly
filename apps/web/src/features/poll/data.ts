import type { PollStatus, Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { shortUrl } from "@rallly/utils/absolute-url";
import { requireSpace } from "@/auth/data";

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
