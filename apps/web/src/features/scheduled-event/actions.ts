"use server";

import { prisma } from "@rallly/database";
import * as z from "zod";
import { getPublicScheduledEvent } from "@/features/scheduled-event/data";
import { cancelRsvp, createRsvp } from "@/features/scheduled-event/mutations";
import {
  getEventPhase,
  isEventFull,
} from "@/features/scheduled-event/registration";
import { AppError } from "@/lib/errors";
import { actionClient, authActionClient } from "@/lib/safe-action/server";

export const submitRsvpAction = actionClient
  .metadata({ actionName: "submit_rsvp" })
  .inputSchema(
    z.object({
      eventId: z.string(),
      name: z.string().trim().min(1).max(100),
      email: z.email(),
      status: z.enum(["accepted", "declined"]),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { eventId, name, email, status } = parsedInput;

    const event = await prisma.scheduledEvent.findUnique({
      where: { id: eventId },
      select: { id: true, deletedAt: true },
    });

    if (!event || event.deletedAt) {
      throw new AppError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }

    return await createRsvp({ eventId, name, email, status });
  });

export const registerForEventAction = authActionClient
  .metadata({ actionName: "register_for_event" })
  .inputSchema(z.object({ eventId: z.string() }))
  .action(async ({ ctx, parsedInput }) => {
    const { eventId } = parsedInput;

    const event = await getPublicScheduledEvent(eventId);

    if (!event || event.deletedAt) {
      throw new AppError({ code: "NOT_FOUND", message: "Event not found" });
    }

    // Re-validate the gate server-side — never trust that the client only
    // showed the one-click button when registration was actually open.
    const phase = getEventPhase({
      status: event.status,
      start: event.start,
      end: event.end,
      now: new Date(),
    });

    if (phase !== "upcoming") {
      throw new AppError({
        code: "FORBIDDEN",
        message: "Registration is closed for this event",
      });
    }

    const acceptedCount = event.invites.filter(
      (invite) => invite.status === "accepted",
    ).length;

    if (isEventFull({ capacity: event.capacity, acceptedCount })) {
      throw new AppError({ code: "FORBIDDEN", message: "Event is full" });
    }

    return await createRsvp({
      eventId,
      name: ctx.user.name,
      email: ctx.user.email,
      status: "accepted",
      inviteeId: ctx.user.id,
    });
  });

export const cancelRsvpAction = actionClient
  .metadata({ actionName: "cancel_rsvp" })
  .inputSchema(
    z.object({
      // The invite uid is an unguessable token that acts as proof of
      // ownership — registrants are unauthenticated.
      inviteUid: z.string().min(1).max(255),
    }),
  )
  .action(async ({ parsedInput }) => {
    return await cancelRsvp({ inviteUid: parsedInput.inviteUid });
  });
