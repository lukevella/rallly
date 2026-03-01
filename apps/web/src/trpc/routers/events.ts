import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import { getEventsChronological } from "@/features/scheduled-event/data";
import { formatEventDateTime } from "@/features/scheduled-event/utils";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { getEmailClient } from "@/utils/emails";
import { createIcsEvent } from "@/utils/ics";
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
        cursor: z.number().optional().default(1),
        limit: z.number().max(100).optional().default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { cursor: page, limit: pageSize, status, search, member } = input;

      const result = await getEventsChronological({
        status,
        search,
        member,
        page,
        pageSize,
        spaceId: ctx.space.id,
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

      const updatedEvent = await prisma.scheduledEvent.update({
        where: { id: input.eventId },
        data: {
          status: "canceled",
          sequence: { increment: 1 },
        },
        include: { invites: true },
      });

      const cancelEvent = createIcsEvent({
        uid: updatedEvent.uid,
        sequence: updatedEvent.sequence,
        title: updatedEvent.title,
        description: updatedEvent.description ?? undefined,
        location: updatedEvent.location ?? undefined,
        start: updatedEvent.start,
        end: updatedEvent.end,
        allDay: updatedEvent.allDay,
        timeZone: updatedEvent.timeZone ?? undefined,
        organizer: {
          name: ctx.user.name,
          email: ctx.user.email,
        },
        attendees: updatedEvent.invites.map((invite) => ({
          name: invite.inviteeName,
          email: invite.inviteeEmail,
        })),
        method: "cancel",
        status: "CANCELLED",
      });

      if (cancelEvent.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate cancellation ICS: ${cancelEvent.error.message}`,
        });
      }

      if (!cancelEvent.value) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate cancellation ICS",
        });
      }

      for (const invite of updatedEvent.invites) {
        if (invite.status !== "declined") {
          const { day, dow, date, time } = formatEventDateTime({
            start: updatedEvent.start,
            end: updatedEvent.end,
            allDay: updatedEvent.allDay,
            timeZone: updatedEvent.timeZone,
            inviteeTimeZone: invite.inviteeTimeZone,
          });

          const emailClient = await getEmailClient();
          emailClient.queueTemplate("EventCanceledEmail", {
            to: invite.inviteeEmail,
            props: {
              title: updatedEvent.title,
              hostName: ctx.user.name,
              day,
              dow,
              date,
              time,
            },
            icalEvent: {
              filename: "cancel.ics",
              method: "cancel",
              content: cancelEvent.value,
            },
          });
        }
      }
    }),
});
