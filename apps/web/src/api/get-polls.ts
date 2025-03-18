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
        options: {
          select: {
            id: true,
            startTime: true,
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
    data: data.map((poll) => ({
      ...poll,
      participants: poll.participants.map((participant) => ({
        id: participant.id,
        name: participant.name,
        image: participant.user?.image ?? undefined,
      })),
      from: poll.options[0]?.startTime,
      to: poll.options[poll.options.length - 1]?.startTime,
    })),
    hasNextPage,
  };
}
