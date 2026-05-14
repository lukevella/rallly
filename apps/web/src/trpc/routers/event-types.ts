import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { isEventTypesEnabled } from "@/features/event-types/constants";
import { createEventTypeDTO, getEventTypes } from "@/features/event-types/data";
import {
  eventTypeInputSchema,
  updateEventTypeInputSchema,
} from "@/features/event-types/schema";
import { middleware, router, spaceProcedure } from "../trpc";

const logger = createLogger("trpc/routers/event-types");

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
      try {
        const updated = await prisma.eventType.update({
          where: {
            id: input.id,
            spaceId: ctx.space.id,
            deleted: false,
          },
          data: {
            name: input.name,
            duration: input.duration,
            capacity: input.capacity,
            description: input.description,
            location: input.location,
          },
        });
        return createEventTypeDTO(updated);
      } catch (error) {
        logger.error(
          { error, eventTypeId: input.id },
          "Failed to update event type",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update event type",
          cause: error,
        });
      }
    }),

  softDelete: eventTypeProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await prisma.eventType.update({
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

        return { success: true };
      } catch (error) {
        logger.error(
          { error, eventTypeId: input.id },
          "Failed to delete event type",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete event type",
          cause: error,
        });
      }
    }),
});
