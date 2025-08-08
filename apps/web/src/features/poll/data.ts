import type { PollStatus, Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { cache } from "react";
import { requireSpace } from "@/auth/data";

type PollFilters = {
  status?: PollStatus;
  page?: number;
  pageSize?: number;
  q?: string;
  member?: string;
};

export const loadPolls = cache(
  async ({ status, page = 1, pageSize = 10, q }: PollFilters) => {
    const space = await requireSpace();

    // Build the where clause based on filters
    const where: Prisma.PollWhereInput = {
      spaceId: space.id,
      status,
      deleted: false,
    };

    // Add search filter if provided
    if (q) {
      where.title = {
        contains: q,
        mode: "insensitive",
      };
    }

    const [total, data] = await Promise.all([
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
              deleted: false,
            },
            select: {
              id: true,
              name: true,
              email: true,
              user: {
                select: {
                  image: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const hasNextPage = page * pageSize < total;

    return {
      total,
      data: data.map((poll) => {
        return {
          ...poll,
          user: poll.user,
          participants: poll.participants.map((participant) => ({
            id: participant.id,
            name: participant.name,
            email: participant.email ?? undefined,
            image: participant.user?.image ?? undefined,
          })),
        };
      }),
      hasNextPage,
    };
  },
);

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

  // Get total count for pagination
  const totalCount = await prisma.poll.count({ where });

  // Load paginated polls
  const polls = await prisma.poll.findMany({
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
        select: {
          id: true,
          name: true,
          email: true,
          user: {
            select: {
              image: true,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

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
      email: participant.email ?? undefined,
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
