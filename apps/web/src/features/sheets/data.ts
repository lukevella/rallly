import type { EventType, Sheet, SheetSlot } from "@rallly/database";
import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import type {
  SheetDetailDTO,
  SheetDTO,
  SheetSlotDTO,
} from "@/features/sheets/types";
import { locationSchema } from "@/lib/location";

const logger = createLogger("sheets/data");

type EventTypeForSlot = Pick<
  EventType,
  "id" | "name" | "duration" | "description" | "location" | "capacity"
>;

type SlotWithRelations = SheetSlot & {
  eventType: EventTypeForSlot;
  scheduledEvent: {
    capacity: number | null;
    _count: { invites: number };
  } | null;
};

function parseLocation(
  raw: EventTypeForSlot["location"],
  context: { eventTypeId: string },
) {
  if (raw === null) {
    return null;
  }
  const parsed = locationSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(
      { eventTypeId: context.eventTypeId, value: raw },
      "Failed to parse event type location",
    );
    return null;
  }
  return parsed.data;
}

export function createSheetSlotDTO(slot: SlotWithRelations): SheetSlotDTO {
  return {
    id: slot.id,
    startTime: slot.startTime,
    eventType: {
      id: slot.eventType.id,
      name: slot.eventType.name,
      duration: slot.eventType.duration,
      description: slot.eventType.description,
      location: parseLocation(slot.eventType.location, {
        eventTypeId: slot.eventType.id,
      }),
      capacity: slot.eventType.capacity,
    },
    bookingCount: slot.scheduledEvent?._count.invites ?? 0,
    capacity: slot.scheduledEvent?.capacity ?? slot.eventType.capacity,
  };
}

export function createSheetDTO(sheet: Sheet): SheetDTO {
  return {
    id: sheet.id,
    title: sheet.title,
    description: sheet.description,
    urlId: sheet.urlId,
    createdAt: sheet.createdAt,
    updatedAt: sheet.updatedAt,
  };
}

export function createSheetDetailDTO(
  sheet: Sheet & { slots: SlotWithRelations[] },
): SheetDetailDTO {
  return {
    ...createSheetDTO(sheet),
    slots: sheet.slots.map(createSheetSlotDTO),
  };
}

const slotInclude = {
  eventType: {
    select: {
      id: true,
      name: true,
      duration: true,
      description: true,
      location: true,
      capacity: true,
    },
  },
  scheduledEvent: {
    select: {
      capacity: true,
      _count: { select: { invites: true } },
    },
  },
} as const;

export async function getSheets(spaceId: string): Promise<SheetDTO[]> {
  const rows = await prisma.sheet.findMany({
    where: { spaceId, deleted: false },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(createSheetDTO);
}

export async function getSheetById(
  id: string,
  spaceId: string,
): Promise<SheetDetailDTO | null> {
  const sheet = await prisma.sheet.findFirst({
    where: { id, spaceId, deleted: false },
    include: {
      slots: {
        orderBy: { startTime: "asc" },
        include: slotInclude,
      },
    },
  });
  return sheet ? createSheetDetailDTO(sheet) : null;
}

export async function getSheetByUrlId(
  urlId: string,
): Promise<SheetDetailDTO | null> {
  const sheet = await prisma.sheet.findFirst({
    where: { urlId, deleted: false },
    include: {
      slots: {
        orderBy: { startTime: "asc" },
        include: slotInclude,
      },
    },
  });
  return sheet ? createSheetDetailDTO(sheet) : null;
}
