import { listScheduledEvents } from "@rallly/features/scheduled-events/api";
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
      const events = await listScheduledEvents({
        userId: ctx.user.id,
        period: input.period,
      });

      return events.map(({ poll, ...event }) => ({
        ...event,
        timeZone: poll?.timeZone || null,
        participants: poll?.participants ?? [],
      }));
    }),
});
