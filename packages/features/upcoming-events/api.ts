import { prisma } from "@rallly/database";

/**
 * List upcoming events for a user grouped by day
 * @param userId
 */
export async function listUpcomingEvents(userId: string) {
  const events = await prisma.event.findMany({
    where: {
      userId,
      start: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      title: true,
      start: true,
      duration: true,
    },
  });

  return events;
}
