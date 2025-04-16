import type { PollStatus, Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";

type PollFilters = {
  userId: string;
  status?: PollStatus;
  page?: number;
  pageSize?: number;
  q?: string;
};

export async function getPolls({
  userId,
  status,
  page = 1,
  pageSize = 10,
  q,
}: PollFilters) {
  // Build the where clause based on filters
  const where: Prisma.PollWhereInput = {
    userId,
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
        event: {
          select: {
            start: true,
            duration: true,
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
        event: poll.event ?? undefined,
      };
    }),
    hasNextPage,
  };
}
