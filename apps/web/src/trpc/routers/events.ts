import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { sendEventCanceledEmail } from "@rallly/emails/templates/event-canceled";
import { TRPCError } from "@trpc/server";
import { after } from "next/server";
import * as z from "zod";
import { getInstanceBranding } from "@/emails/branding";
import { parseConferencing } from "@/features/conferencing/data";
import { getConferencingUri } from "@/features/conferencing/utils";
import { parseLocation } from "@/features/location/data";
import { formatLocationText } from "@/features/location/utils";
import { getEventsChronological } from "@/features/scheduled-event/data";
import { formatEventDateTime } from "@/features/scheduled-event/utils";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { timeZoneSchema } from "@/lib/datetime/schema";
import { normalizeTimeZone } from "@/lib/datetime/utils";
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
        spaceId: ctx.space.id,
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

      const updatedEvent = await prisma.scheduledEvent.findUniqueOrThrow({
        where: { id: input.eventId },
        include: { invites: true },
      });

      const cancelLocation = parseLocation(updatedEvent.location, {
        scheduledEventId: updatedEvent.id,
      });
      const cancelConferencing = parseConferencing(updatedEvent.conferencing, {
        scheduledEventId: updatedEvent.id,
      });
      const cancelLocationText = cancelLocation
        ? formatLocationText(cancelLocation)
        : undefined;
      const cancelConferencingUri = cancelConferencing
        ? getConferencingUri(cancelConferencing)
        : undefined;
      const cancelDescriptionParts: string[] = [];
      if (updatedEvent.description) {
        cancelDescriptionParts.push(updatedEvent.description);
      }
      if (cancelConferencingUri) {
        cancelDescriptionParts.push(cancelConferencingUri);
      }
      const cancelDescription =
        cancelDescriptionParts.length > 0
          ? cancelDescriptionParts.join("\n\n")
          : undefined;

      const cancelEvent = createIcsEvent({
        uid: updatedEvent.uid,
        sequence: updatedEvent.sequence,
        title: updatedEvent.title,
        description: cancelDescription,
        location: cancelLocationText ?? cancelConferencingUri,
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
            locale: invite.inviteeLocale ?? undefined,
          });

          after(async () =>
            sendEventCanceledEmail({
              to: invite.inviteeEmail,
              locale: invite.inviteeLocale ?? undefined,
              branding: await getInstanceBranding(),
              icalEvent: {
                filename: "cancel.ics",
                method: "cancel",
                content: cancelEvent.value,
              },
              props: {
                title: updatedEvent.title,
                hostName: ctx.user.name,
                day,
                dow,
                date,
                time,
              },
            }),
          );
        }
      }
    }),
});
