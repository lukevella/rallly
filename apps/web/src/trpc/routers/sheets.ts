import { Prisma, prisma } from "@rallly/database";
import { nanoid } from "@rallly/utils/nanoid";
import { TRPCError } from "@trpc/server";
import * as z from "zod";
import type { Conferencing } from "@/features/conferencing/schema";
import type { Location as ScheduledEventLocation } from "@/features/location/schema";
import { isSignupSheetsEnabled } from "@/features/sheets/constants";
import {
  createSheetDTO,
  getSheetById,
  getSheetByUrlId,
  getSheets,
} from "@/features/sheets/data";
import {
  createBookingInputSchema,
  createSheetInputSchema,
  createSlotInputSchema,
  updateSheetInputSchema,
} from "@/features/sheets/schema";
import type { Location } from "@/lib/location";
import { locationSchema } from "@/lib/location";
import {
  mergeRouters,
  middleware,
  publicProcedure,
  router,
  spaceProcedure,
} from "../trpc";

const requireSignupSheetsEnabled = middleware(async ({ next }) => {
  if (!isSignupSheetsEnabled) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Sign-up sheets are not enabled",
    });
  }
  return next();
});

const sheetSpaceProcedure = spaceProcedure.use(requireSignupSheetsEnabled);
const sheetPublicProcedure = publicProcedure.use(requireSignupSheetsEnabled);

// Convert an EventType.location (in_person or custom_link) into the new
// scheduled-event structured `location` / `conferencing` columns. An
// in-person source becomes a custom location; a custom link becomes
// conferencing metadata.
function locationSnapshot(value: unknown): {
  location: ScheduledEventLocation | null;
  conferencing: Conferencing | null;
} {
  if (value === null || value === undefined) {
    return { location: null, conferencing: null };
  }
  const parsed = locationSchema.safeParse(value);
  if (!parsed.success) {
    return { location: null, conferencing: null };
  }
  const source: Location = parsed.data;
  if (source.type === "in_person") {
    return {
      location: {
        provider: "custom",
        address: source.address,
      },
      conferencing: null,
    };
  }
  return {
    location: null,
    conferencing: {
      provider: "custom",
      uri: source.url,
      label: source.text ?? source.url,
    },
  };
}

const sheetsRoot = router({
  list: sheetSpaceProcedure.query(async ({ ctx }) => {
    const sheets = await getSheets(ctx.space.id);
    return { sheets };
  }),

  get: sheetSpaceProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const sheet = await getSheetById(input.id, ctx.space.id);
      if (!sheet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sheet not found" });
      }
      return { sheet };
    }),

  getByUrlId: sheetPublicProcedure
    .input(z.object({ urlId: z.string() }))
    .query(async ({ input }) => {
      const sheet = await getSheetByUrlId(input.urlId);
      if (!sheet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sheet not found" });
      }
      return { sheet };
    }),

  create: sheetSpaceProcedure
    .input(createSheetInputSchema)
    .mutation(async ({ ctx, input }) => {
      const created = await prisma.sheet.create({
        data: {
          spaceId: ctx.space.id,
          hostId: ctx.user.id,
          title: input.title,
          urlId: nanoid(),
        },
      });
      return { sheet: createSheetDTO(created) };
    }),

  update: sheetSpaceProcedure
    .input(updateSheetInputSchema)
    .mutation(async ({ ctx, input }) => {
      const updated = await prisma.sheet.updateMany({
        where: {
          id: input.id,
          spaceId: ctx.space.id,
          deleted: false,
        },
        data: {
          title: input.title,
        },
      });
      if (updated.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sheet not found" });
      }
      return { success: true };
    }),

  softDelete: sheetSpaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await prisma.sheet.updateMany({
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
      if (deleted.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sheet not found" });
      }
      return { success: true };
    }),
});

const slots = router({
  create: sheetSpaceProcedure
    .input(createSlotInputSchema)
    .mutation(async ({ ctx, input }) => {
      const sheet = await prisma.sheet.findFirst({
        where: {
          id: input.sheetId,
          spaceId: ctx.space.id,
          deleted: false,
        },
        select: { id: true },
      });
      if (!sheet) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Sheet not found" });
      }

      const eventType = await prisma.eventType.findFirst({
        where: {
          id: input.eventTypeId,
          spaceId: ctx.space.id,
          deleted: false,
        },
        select: { id: true },
      });
      if (!eventType) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Event type not found in this space",
        });
      }

      const slot = await prisma.sheetSlot.create({
        data: {
          sheetId: input.sheetId,
          eventTypeId: input.eventTypeId,
          startTime: input.startTime,
        },
      });

      return {
        slot: {
          id: slot.id,
          sheetId: slot.sheetId,
          eventTypeId: slot.eventTypeId,
          startTime: slot.startTime,
          createdAt: slot.createdAt,
          updatedAt: slot.updatedAt,
        },
      };
    }),

  delete: sheetSpaceProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const slot = await prisma.sheetSlot.findFirst({
        where: {
          id: input.id,
          sheet: { spaceId: ctx.space.id, deleted: false },
        },
        select: {
          id: true,
          scheduledEvent: { select: { id: true } },
        },
      });
      if (!slot) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Slot not found" });
      }
      if (slot.scheduledEvent) {
        throw new TRPCError({
          code: "CONFLICT",
          message:
            "Cannot delete a slot with bookings. Cancel the booking first.",
        });
      }
      await prisma.sheetSlot.delete({ where: { id: input.id } });
      return { success: true };
    }),
});

const bookings = router({
  create: sheetPublicProcedure
    .input(createBookingInputSchema)
    .mutation(async ({ input }) => {
      return await prisma.$transaction(async (tx) => {
        // Lock the slot row to serialize concurrent bookings on the same slot
        await tx.$queryRaw`SELECT id FROM "sheet_slots" WHERE id = ${input.slotId} FOR UPDATE`;

        const slot = await tx.sheetSlot.findFirst({
          where: {
            id: input.slotId,
            sheet: { deleted: false },
          },
          include: {
            sheet: { select: { spaceId: true } },
            eventType: {
              select: {
                id: true,
                name: true,
                description: true,
                location: true,
                duration: true,
                capacity: true,
                hostId: true,
              },
            },
            scheduledEvent: {
              select: {
                id: true,
                capacity: true,
                _count: { select: { invites: true } },
              },
            },
          },
        });

        if (!slot) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Slot not found",
          });
        }

        const capacity =
          slot.scheduledEvent?.capacity ?? slot.eventType.capacity;
        const currentCount = slot.scheduledEvent?._count.invites ?? 0;

        if (capacity !== null && currentCount >= capacity) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "This slot is full",
          });
        }

        if (slot.scheduledEvent) {
          const existing = await tx.scheduledEventInvite.findFirst({
            where: {
              scheduledEventId: slot.scheduledEvent.id,
              inviteeEmail: input.email,
            },
            select: { id: true },
          });
          if (existing) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "You've already booked this slot",
            });
          }
        }

        const inviteUid = nanoid();
        const endTime = new Date(
          slot.startTime.getTime() + slot.eventType.duration * 60_000,
        );

        if (slot.scheduledEvent) {
          try {
            // Backs the existence check above: the unique
            // (scheduledEventId, inviteeEmail) index rejects a concurrent
            // duplicate booking that races past it.
            await tx.scheduledEventInvite.create({
              data: {
                uid: inviteUid,
                scheduledEventId: slot.scheduledEvent.id,
                inviteeName: input.name,
                inviteeEmail: input.email,
                inviteeTimeZone: input.timeZone,
                status: "accepted",
              },
            });
          } catch (e) {
            if (
              e instanceof Prisma.PrismaClientKnownRequestError &&
              e.code === "P2002"
            ) {
              throw new TRPCError({
                code: "CONFLICT",
                message: "You've already booked this slot",
              });
            }
            throw e;
          }
          return {
            scheduledEventId: slot.scheduledEvent.id,
            attendeeUid: inviteUid,
          };
        }

        const host = await tx.user.findUnique({
          where: { id: slot.eventType.hostId },
          select: { timeZone: true },
        });

        const eventId = nanoid();
        const { location, conferencing } = locationSnapshot(
          slot.eventType.location,
        );
        const created = await tx.scheduledEvent.create({
          data: {
            id: eventId,
            uid: `${eventId}@rallly.co`,
            sheetSlotId: slot.id,
            eventTypeId: slot.eventType.id,
            userId: slot.eventType.hostId,
            spaceId: slot.sheet.spaceId,
            title: slot.eventType.name,
            description: slot.eventType.description,
            location: location ?? undefined,
            conferencing: conferencing ?? undefined,
            capacity: slot.eventType.capacity,
            start: slot.startTime,
            end: endTime,
            timeZone: host?.timeZone ?? null,
            status: "confirmed",
            invites: {
              create: {
                uid: inviteUid,
                inviteeName: input.name,
                inviteeEmail: input.email,
                inviteeTimeZone: input.timeZone,
                status: "accepted",
              },
            },
          },
        });

        return {
          scheduledEventId: created.id,
          attendeeUid: inviteUid,
        };
      });
    }),
});

export const sheets = mergeRouters(
  sheetsRoot,
  router({
    slots,
    bookings,
  }),
);
