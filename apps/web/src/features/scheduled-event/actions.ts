"use server";

import { prisma } from "@rallly/database";
import * as z from "zod";
import { cancelRsvp, createRsvp } from "@/features/scheduled-event/mutations";
import { AppError } from "@/lib/errors";
import { actionClient } from "@/lib/safe-action/server";

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
