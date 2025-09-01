"use server";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { z } from "zod";
import { AppError } from "@/lib/errors";
import { spaceActionClient } from "@/lib/safe-action/server";
import { getEmailClient } from "@/utils/emails";
import { createIcsEvent } from "@/utils/ics";
import { formatEventDateTime } from "./utils";

export const cancelEventAction = spaceActionClient
  .metadata({ actionName: "cancel_event" })
  .inputSchema(
    z.object({
      eventId: z.string(),
    }),
  )
  .action(async ({ ctx, parsedInput }) => {
    const event = await prisma.scheduledEvent.findUnique({
      where: {
        id: parsedInput.eventId,
      },
    });

    if (!event) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }

    if (
      ctx.getMemberAbility().cannot("cancel", subject("ScheduledEvent", event))
    ) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to cancel this event",
      });
    }

    const updatedEvent = await prisma.scheduledEvent.update({
      where: {
        id: parsedInput.eventId,
      },
      data: {
        status: "canceled",
        sequence: {
          increment: 1,
        },
      },
      include: {
        invites: true,
      },
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
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to generate cancellation ICS: ${cancelEvent.error.message}`,
      });
    }

    if (!cancelEvent.value) {
      throw new AppError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate cancellation ICS",
      });
    }

    // notify attendees
    const attendees = await prisma.scheduledEventInvite.findMany({
      where: {
        scheduledEventId: parsedInput.eventId,
      },
      select: {
        inviteeEmail: true,
        inviteeName: true,
        inviteeTimeZone: true,
        status: true,
      },
    });

    for (const attendee of attendees) {
      if (attendee.status !== "declined") {
        const { day, dow, date, time } = formatEventDateTime({
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          timeZone: event.timeZone,
          inviteeTimeZone: attendee.inviteeTimeZone,
        });

        getEmailClient().queueTemplate("EventCanceledEmail", {
          to: attendee.inviteeEmail,
          props: {
            title: event.title,
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
  });
