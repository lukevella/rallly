import { prisma } from "@rallly/database";

export type EventPeriod = "upcoming" | "past";

/**
 * List upcoming events for a user grouped by day
 * @param userId
 */
export async function listScheduledEvents({
  userId,
  period,
}: {
  userId: string;
  period: EventPeriod;
}) {
  const events = await prisma.event.findMany({
    select: {
      id: true,
      title: true,
      start: true,
      duration: true,
      poll: {
        select: {
          timeZone: true,
          participants: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    where: {
      userId,
      start: period === "upcoming" ? { gte: new Date() } : { lt: new Date() },
    },
    orderBy: [
      {
        start: "desc",
      },
      {
        title: "asc",
      },
    ],
  });

  return events;
}
