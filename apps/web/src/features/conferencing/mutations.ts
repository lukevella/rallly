import "server-only";

import { prisma } from "@rallly/database";
import { Effect } from "effect";
import { fromPrisma } from "@/lib/effect/db";
import type { UserInfo } from "@/lib/oauth/types";

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

// Only the connection goes; the credential row may still back a calendar
// connection on the same Google account.
export const disconnectConferencingConnection = async ({
  userId,
  id,
}: {
  userId: string;
  id: string;
}) => {
  const connection = await prisma.conferencingConnection.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!connection) {
    return { ok: false as const, reason: "not_found" as const };
  }

  await prisma.conferencingConnection.delete({ where: { id } });

  return { ok: true as const };
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
