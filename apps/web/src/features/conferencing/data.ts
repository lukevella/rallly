import "server-only";

import type { Prisma } from "@rallly/database";
import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import type {
  Conferencing,
  ConferencingProvider,
  PollConferencing,
} from "./schema";
import {
  conferencingProviderSchema,
  conferencingSchema,
  pollConferencingSchema,
} from "./schema";
import { conferencingProviderIntegrations } from "./utils";

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

export function parsePollConferencing(
  raw: Prisma.JsonValue | null,
  context?: { pollId?: string },
): PollConferencing | null {
  if (raw === null) {
    return null;
  }
  const parsed = pollConferencingSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(
      { pollId: context?.pollId, value: raw },
      "Failed to parse poll conferencing",
    );
    return null;
  }
  return parsed.data;
}

export const getConferencingConnections = async (userId: string) => {
  return await prisma.conferencingConnection.findMany({
    where: { userId },
    select: {
      id: true,
      provider: true,
      integrationId: true,
      email: true,
      displayName: true,
    },
    orderBy: { createdAt: "asc" },
  });
};

// The providers a user can mint links for, derived from the integrations they
// have connected. One Google account may back both calendar and Meet, so the
// integration id (not the OAuth provider) decides.
export const getConnectedConferencingProviders = async (
  userId: string,
): Promise<ConferencingProvider[]> => {
  const connections = await prisma.conferencingConnection.findMany({
    where: { userId },
    select: { integrationId: true },
    distinct: ["integrationId"],
  });
  const connected = new Set(connections.map((c) => c.integrationId));
  return conferencingProviderSchema.options.filter((provider) =>
    connected.has(conferencingProviderIntegrations[provider].integrationId),
  );
};

export const getConferencingConnectionForProvider = async ({
  userId,
  provider,
}: {
  userId: string;
  provider: ConferencingProvider;
}) => {
  return await prisma.conferencingConnection.findFirst({
    where: {
      userId,
      integrationId: conferencingProviderIntegrations[provider].integrationId,
    },
    select: { id: true, credentialId: true, email: true },
    orderBy: { createdAt: "asc" },
  });
};
