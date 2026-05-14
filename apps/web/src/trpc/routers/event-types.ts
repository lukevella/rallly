import { prisma } from "@rallly/database";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { isEventTypesEnabled } from "@/features/event-types/constants";
import { createEventTypeDTO, getEventTypes } from "@/features/event-types/data";
import {
  eventTypeInputSchema,
  updateEventTypeInputSchema,
} from "@/features/event-types/schema";
import { middleware, router, spaceProcedure } from "../trpc";

const requireEventTypesEnabled = middleware(async ({ next }) => {
  if (!isEventTypesEnabled) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Event types are not enabled",
    });
  }
  return next();
});

const eventTypeProcedure = spaceProcedure.use(requireEventTypesEnabled);

export const eventTypes = router({
  list: eventTypeProcedure.query(async ({ ctx }) => {
    const eventTypes = await getEventTypes(ctx.space.id);
    return { eventTypes };
  }),

  create: eventTypeProcedure
    .input(eventTypeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await prisma.eventType.create({
        data: {
          spaceId: ctx.space.id,
          hostId: ctx.user.id,
          name: input.name,
          duration: input.duration,
          capacity: input.capacity,
          description: input.description,
          location: input.location,
        },
      });
      return createEventTypeDTO(created);
    }),

  update: eventTypeProcedure
    .input(updateEventTypeInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await prisma.eventType.findFirst({
        where: {
          id: input.id,
          spaceId: ctx.space.id,
          deleted: false,
        },
        select: { id: true },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event type not found",
        });
      }

      const updated = await prisma.eventType.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          duration: input.duration,
          capacity: input.capacity,
          description: input.description,
          location: input.location,
        },
      });
      return createEventTypeDTO(updated);
    }),

  softDelete: eventTypeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { count } = await prisma.eventType.updateMany({
        where: {
          id: input.id,
          spaceId: ctx.space.id,
          deleted: false,
        },
        data: {
          deleted: true,
          deletedAt: new Date(),
        },
      });

      if (count === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event type not found",
        });
      }
    }),
});
