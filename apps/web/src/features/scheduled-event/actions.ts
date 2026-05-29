"use server";

import { prisma } from "@rallly/database";
import { nanoid } from "@rallly/utils/nanoid";
import { updateTag } from "next/cache";
import * as z from "zod";
import { scheduledEventTag } from "@/features/scheduled-event/constants";
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

    const existing = await prisma.scheduledEventInvite.findFirst({
      where: { scheduledEventId: eventId, inviteeEmail: email },
      select: { id: true },
    });

    if (existing) {
      return { ok: false, reason: "already_responded" } as const;
    }

    await prisma.scheduledEventInvite.create({
      data: {
        uid: nanoid(),
        scheduledEventId: eventId,
        inviteeName: name,
        inviteeEmail: email,
        status,
      },
    });

    updateTag(scheduledEventTag(eventId));

    return { ok: true } as const;
  });
