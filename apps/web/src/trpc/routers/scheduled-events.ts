import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import toArray from "dayjs/plugin/toArray";
import utc from "dayjs/plugin/utc";
import { z } from "zod";

import { possiblyPublicProcedure, router } from "../trpc";

dayjs.extend(toArray);
dayjs.extend(timezone);
dayjs.extend(utc);

export const scheduledEvents = router({
  list: possiblyPublicProcedure
    .input(
      z.object({
        period: z.enum(["upcoming", "past"]).default("upcoming"),
      }),
    )
    .query(async ({ input, ctx }) => {
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
          userId: ctx.user.id,
          start:
            input.period === "upcoming"
              ? { gte: new Date() }
              : { lt: new Date() },
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

      return events.map(({ poll, ...event }) => ({
        ...event,
        timeZone: poll?.timeZone || null,
        participants: poll?.participants ?? [],
      }));
    }),
});
