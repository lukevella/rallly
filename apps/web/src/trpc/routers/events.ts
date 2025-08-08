import { z } from "zod";
import { getEventsChronological } from "@/features/scheduled-event/data";
import { privateProcedure, router } from "../trpc";

export const events = router({
  infiniteList: privateProcedure
    .input(
      z.object({
        status: z
          .enum(["upcoming", "past", "unconfirmed", "canceled"])
          .optional(),
        search: z.string().optional(),
        member: z.string().optional(),
        cursor: z.number().optional().default(1),
        limit: z.number().max(100).optional().default(20),
      }),
    )
    .query(async ({ input }) => {
      const { cursor: page, limit: pageSize, status, search, member } = input;

      const result = await getEventsChronological({
        status,
        search,
        member,
        page,
        pageSize,
      });

      let nextCursor: number | undefined;
      if (result.hasNextPage) {
        nextCursor = page + 1;
      }

      return {
        events: result.events,
        nextCursor,
        hasNextPage: result.hasNextPage,
        total: result.total,
      };
    }),
});
