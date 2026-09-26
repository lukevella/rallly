import "server-only";

import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { Effect } from "effect";
import { after } from "next/server";
import { loadCredential } from "@/features/credentials/data";
import { fromPrisma } from "@/lib/effect/db";
import type { UserInfo } from "@/lib/oauth/types";
import { revokeZoomToken } from "./service";

const logger = createLogger("conferencing/mutations");

export const createConferencingConnection = async ({
  userId,
  provider,
  providerAccountId,
  integrationId,
  credentialId,
  displayName,
  userInfo,
}: {
  userId: string;
  provider: string;
  providerAccountId: string;
  integrationId: string;
  credentialId: string;
  displayName: string;
  userInfo: UserInfo;
}) => {
  return await prisma.conferencingConnection.upsert({
    where: {
      user_provider_account_unique: {
        userId,
        provider,
        providerAccountId,
      },
    },
    create: {
      userId,
      provider,
      integrationId,
      credentialId,
      providerAccountId,
      email: userInfo.email,
      displayName,
    },
    update: {
      credentialId,
      email: userInfo.email,
    },
  });
};

export const disconnectConferencingConnection = async ({
  userId,
  id,
}: {
  userId: string;
  id: string;
}) => {
  const connection = await prisma.conferencingConnection.findFirst({
    where: { id, userId },
    select: { id: true, provider: true, credentialId: true },
  });

  if (!connection) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await removeConferencingConnection(connection);

  return { ok: true as const };
};

const removeConferencingConnection = async ({
  id,
  provider,
  credentialId,
}: {
  id: string;
  provider: string;
  credentialId: string;
}) => {
  // Read before the delete, which takes the tokens needed to revoke the grant.
  // A credential that cannot be read must not block the disconnect.
  const credential =
    provider === "zoom"
      ? await loadCredential(credentialId).catch((error) => {
          logger.warn(
            { err: error, credentialId },
            "Failed to read credential",
          );
          return null;
        })
      : null;

  // A Google credential can also back a calendar connection on the same
  // account, so the credential goes only once nothing references it.
  const [, { count }] = await prisma.$transaction([
    prisma.conferencingConnection.delete({ where: { id } }),
    prisma.credential.deleteMany({
      where: {
        id: credentialId,
        calendarConnections: { none: {} },
        conferencingConnections: { none: {} },
      },
    }),
  ]);

  if (count > 0 && credential) {
    // The disconnect is done once the rows are gone; Zoom need not answer first.
    after(() => revokeZoomToken({ credential }));
  }
};

// Zoom has already revoked the grant, so unlike a disconnect there is nothing
// to revoke. The Zoom user id is global, so every Rallly account that linked it
// loses the connection, and every Zoom credential for it goes, including one
// an earlier disconnect left behind.
export const removeDeauthorizedZoomUser = Effect.fn(
  "conferencing.removeDeauthorizedZoomUser",
)(function* ({ zoomUserId }: { zoomUserId: string }) {
  const [connections, credentials] = yield* fromPrisma(() =>
    prisma.$transaction([
      prisma.conferencingConnection.deleteMany({
        where: { provider: "zoom", providerAccountId: zoomUserId },
      }),
      prisma.credential.deleteMany({
        where: {
          provider: "zoom",
          providerAccountId: zoomUserId,
          calendarConnections: { none: {} },
          conferencingConnections: { none: {} },
        },
      }),
    ]),
  );
  return {
    removedConnections: connections.count,
    removedCredentials: credentials.count,
  };
});
