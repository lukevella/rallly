import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { unstable_cache } from "next/cache";

type PollFilters = {
  userId: string;
  limit?: number;
};

export const getRecentlyUpdatedPolls = async ({
  userId,
  limit = 3,
}: PollFilters) => {
  // Build the where clause based on filters
  const where: Prisma.PollWhereInput = {
    userId,
    deleted: false,
  };

  const data = await prisma.poll.findMany({
    where,
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
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
          createdAt: "desc",
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
    take: limit,
  });

  return data.map((poll) => {
    const { options, ...rest } = poll;
    const durations = new Set<number>();
    for (const option of options) {
      durations.add(option.duration);
    }
    return {
      ...rest,
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
  });
};

export const getCachedRecentlyUpdatedPolls = unstable_cache(
  getRecentlyUpdatedPolls,
  undefined,
  {
    revalidate: 60 * 5,
    tags: ["polls"],
  },
);
