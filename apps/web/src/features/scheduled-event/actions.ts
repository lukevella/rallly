"use server";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { z } from "zod";
import { spaceActionClient } from "@/features/safe-action/server";
import { AppError } from "@/lib/errors";
import { getEmailClient } from "@/utils/emails";
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

    if (ctx.ability.cannot("cancel", subject("ScheduledEvent", event))) {
      throw new AppError({
        code: "UNAUTHORIZED",
        message: "You do not have permission to cancel this event",
      });
    }

    await prisma.scheduledEvent.update({
      where: {
        id: parsedInput.eventId,
      },
      data: {
        status: "canceled",
      },
    });

    ctx.captureProperties({
      eventId: parsedInput.eventId,
    });

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
        });
      }
    }
  });
