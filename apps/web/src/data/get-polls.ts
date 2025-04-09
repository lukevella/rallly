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
        options: {
          select: {
            id: true,
            startTime: true,
            duration: true,
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
      const { options, ...rest } = poll;
      const durations = new Set<number>();
      for (const option of options) {
        durations.add(option.duration);
      }
      return {
        ...rest,
        user: poll.user,
        participants: poll.participants.map((participant) => ({
          id: participant.id,
          name: participant.name,
          image: participant.user?.image ?? undefined,
        })),
        dateOptions: {
          first: options[0]?.startTime,
          last: options[options.length - 1]?.startTime,
          count: options.length,
          duration:
            durations.size === 1
              ? (durations.values().next().value as number)
              : Array.from(durations),
        },
        event: poll.event ?? undefined,
      };
    }),
    hasNextPage,
  };
}
