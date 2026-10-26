import * as z from "zod";
import { inboxNotificationLimit } from "@/features/notifications/constants";
import { listInboxNotifications } from "@/features/notifications/data";
import { privateProcedure, router } from "../trpc";

export const notifications = router({
  inbox: privateProcedure
    .input(z.object({ cursor: z.string().nullish() }))
    .query(async ({ ctx, input }) => {
      return listInboxNotifications({
        userId: ctx.user.id,
        limit: inboxNotificationLimit,
        cursor: input.cursor ?? undefined,
      });
    }),
});
