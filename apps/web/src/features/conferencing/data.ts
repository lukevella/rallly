import "server-only";

import type { Prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import type { Conferencing } from "./schema";
import { conferencingSchema } from "./schema";

const logger = createLogger("conferencing/data");

export function parseConferencing(
  raw: Prisma.JsonValue | null,
  context?: { scheduledEventId?: string },
): Conferencing | null {
  if (raw === null) {
    return null;
  }
  const parsed = conferencingSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(
      { scheduledEventId: context?.scheduledEventId, value: raw },
      "Failed to parse conferencing",
    );
    return null;
  }
  return parsed.data;
}
