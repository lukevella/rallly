import type { PollStatus, Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import { cache } from "react";
import { loadActiveSpace } from "@/data/space";

type PollFilters = {
  status?: PollStatus;
  page?: number;
  pageSize?: number;
  q?: string;
};

type DateRange = {
  startDate: Date;
  endDate: Date;
  timeZone: string | null;
  isFloating: boolean;
} | null;

function calculateDateRange(
  options: { startTime: Date; duration: number }[],
): DateRange {
  if (options.length === 0) return null;

  const sortedOptions = options.sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );
  const firstOption = sortedOptions[0];
  const lastOption = sortedOptions[sortedOptions.length - 1];

  const startDate = firstOption.startTime;
  const endDate = dayjs(lastOption.startTime)
    .add(lastOption.duration, "minute")
    .toDate();

  return {
    startDate,
    endDate,
  };
}

export const loadPolls = cache(
  async ({ status, page = 1, pageSize = 10, q }: PollFilters) => {
    const space = await loadActiveSpace();

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
          timeZone: true,
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
          options: {
            select: {
              startTime: true,
              duration: true,
            },
            orderBy: {
              startTime: "asc",
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
        const dateRange = calculateDateRange(poll.options);
        return {
          ...poll,
          user: poll.user,
          participants: poll.participants.map((participant) => ({
            id: participant.id,
            name: participant.name,
            email: participant.email ?? undefined,
            image: participant.user?.image ?? undefined,
          })),
          dateRange,
        };
      }),
      hasNextPage,
    };
  },
);
