import { prisma } from "@rallly/database";
import { listUpcomingEvents } from "@rallly/features/upcoming-events/api";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import toArray from "dayjs/plugin/toArray";
import utc from "dayjs/plugin/utc";

import { publicProcedure, router } from "../trpc";

dayjs.extend(toArray);
dayjs.extend(timezone);
dayjs.extend(utc);

export const events = router({
  listUpcoming: publicProcedure.query(async ({ ctx }) => {
    const events = await listUpcomingEvents(ctx.user.id);
    return events;
  }),
  listPending: publicProcedure.query(async ({ ctx }) => {
    const events = await prisma.poll.findMany({
      where: {
        userId: ctx.user.id,
        deleted: false,
        status: {
          not: "finalized",
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        participants: {
          select: {
            id: true,
            name: true,
          },
          orderBy: [
            {
              createdAt: "desc",
            },
            { name: "desc" },
          ],
        },
      },
      orderBy: [
        {
          createdAt: "desc",
        },
        {
          title: "asc",
        },
      ],
    });

    return events;
  }),
});
