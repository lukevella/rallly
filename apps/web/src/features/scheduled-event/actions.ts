"use server";
import { ActionError, authActionClient } from "@/features/safe-action/server";
import { subject } from "@casl/ability";
import { prisma } from "@rallly/database";
import { z } from "zod";

export const cancelEventAction = authActionClient
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
      throw new ActionError({
        code: "NOT_FOUND",
        message: "Event not found",
      });
    }

    if (ctx.ability.cannot("update", subject("ScheduledEvent", event))) {
      throw new ActionError({
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
  });
