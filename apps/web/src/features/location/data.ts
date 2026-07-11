import "server-only";

import type { Prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import type { Location } from "./schema";
import { locationSchema } from "./schema";

const logger = createLogger("location/data");

export function parseLocation(
  raw: Prisma.JsonValue | null,
  context?: { scheduledEventId?: string },
): Location | null {
  if (raw === null) {
    return null;
  }
  const parsed = locationSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(
      { scheduledEventId: context?.scheduledEventId, value: raw },
      "Failed to parse location",
    );
    return null;
  }
  return parsed.data;
}
