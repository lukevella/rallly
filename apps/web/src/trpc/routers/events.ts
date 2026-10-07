import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { getEventsChronological } from "@/features/scheduled-event/data";
import { sendScheduledEventCanceledEmails } from "@/features/scheduled-event/mutations";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { timeZoneSchema } from "@/lib/datetime/schema";
import { normalizeTimeZone } from "@/lib/datetime/utils";
import { router, spaceProcedure } from "../trpc";

export const events = router({
  infiniteList: spaceProcedure
    .input(
      z.object({
        status: z
          .enum(["upcoming", "past", "unconfirmed", "canceled"])
          .optional(),
        search: z.string().optional(),
        member: z.string().optional(),
        timeZone: timeZoneSchema.optional(),
        cursor: z.number().optional().default(1),
        limit: z.number().max(100).optional().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor: page, limit: pageSize, status, search, member } = input;
      const timeZone =
        input.timeZone ?? normalizeTimeZone(ctx.user.timeZone) ?? "UTC";

      const result = await getEventsChronological({
        status,
        search,
        member,
        page,
        pageSize,
        scope: ctx.contentScope,
        timeZone,
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

  cancel: spaceProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const memberAbility = defineAbilityForMember({
        user: ctx.user,
        space: ctx.space,
      });

      const event = await prisma.scheduledEvent.findFirst({
        where: { id: input.eventId, spaceId: ctx.space.id },
      });

      if (!event) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event not found",
        });
      }

      if (memberAbility.cannot("cancel", subject("ScheduledEvent", event))) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have permission to cancel this event",
        });
      }

      // Atomically update only if not already canceled to ensure idempotency
      const { count } = await prisma.scheduledEvent.updateMany({
        where: {
          id: input.eventId,
          status: { not: "canceled" },
        },
        data: {
          status: "canceled",
          sequence: { increment: 1 },
        },
      });

      // Already canceled — skip notifications
      if (count === 0) {
        return;
      }

      await sendScheduledEventCanceledEmails({
        eventId: input.eventId,
        organizer: { name: ctx.user.name, email: ctx.user.email },
      });
    }),
});
