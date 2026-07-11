import "server-only";

import type { EventType, User } from "@rallly/database";
import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import type { EventTypeDTO } from "@/features/event-types/types";
import type { Location } from "@/lib/location";
import { locationSchema } from "@/lib/location";

const logger = createLogger("event-types/data");

export function createEventTypeDTO(
  eventType: EventType & { host: Pick<User, "id" | "name" | "image"> },
): EventTypeDTO {
  let location: Location | null = null;
  if (eventType.location !== null) {
    try {
      location = locationSchema.parse(eventType.location);
    } catch (error) {
      logger.warn(
        { error, eventTypeId: eventType.id, value: eventType.location },
        "Failed to parse event type location",
      );
    }
  }
  return {
    id: eventType.id,
    name: eventType.name,
    duration: eventType.duration,
    capacity: eventType.capacity,
    description: eventType.description,
    location,
    hostId: eventType.hostId,
    host: {
      id: eventType.host.id,
      name: eventType.host.name,
      image: eventType.host.image,
    },
    spaceId: eventType.spaceId,
    createdAt: eventType.createdAt,
    updatedAt: eventType.updatedAt,
  };
}

export async function getEventTypes(spaceId: string): Promise<EventTypeDTO[]> {
  const rows = await prisma.eventType.findMany({
    where: {
      spaceId,
      deleted: false,
    },
    orderBy: { updatedAt: "desc" },
    include: {
      host: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return rows.map(createEventTypeDTO);
}
