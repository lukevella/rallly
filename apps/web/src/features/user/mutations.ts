import "server-only";

import type { TimeFormat } from "@rallly/database";
import { prisma } from "@rallly/database";
import { revalidateTag } from "next/cache";
import { headers } from "next/headers";
import { userProfileTag } from "@/features/user/constants";
import { authLib } from "@/lib/auth";

export async function createUser({
  name,
  email,
  emailVerified,
  image,
  timeZone,
  timeFormat,
  locale,
  weekStart,
}: {
  name: string;
  email: string;
  emailVerified?: boolean;
  image?: string;
  timeZone?: string;
  timeFormat?: TimeFormat;
  locale?: string;
  weekStart?: number;
}) {
  const user = await prisma.user.create({
    data: {
      name,
      email,
      emailVerified,
      image,
      timeZone,
      timeFormat,
      locale,
      weekStart,
      role: "user",
    },
  });

  return user;
}

// Profile updates must go through Better-Auth rather than Prisma so that the
// session cookie cache and the cached session data in secondary storage get
// refreshed. Better-Auth always updates the user tied to the session in
// `headers`, so `userId` must be the current user's id (it scopes the cache
// tag).

export async function updateUserName({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  await authLib.api.updateUser({
    body: { name },
    headers: await headers(),
  });

  revalidateTag(userProfileTag(userId), "max");
}

export async function updateUserImage({
  userId,
  image,
}: {
  userId: string;
  image: string | null;
}) {
  await authLib.api.updateUser({
    body: { image },
    headers: await headers(),
  });

  revalidateTag(userProfileTag(userId), "max");
}

// Role changes must go through Better-Auth's internal adapter so the user
// snapshot cached in each session (secondary storage) gets refreshed — a bare
// Prisma write leaves every active session on the old role, and Better-Auth's
// own permission checks (e.g. banUser) read the session, not the database.
// The admin plugin's setRole endpoint is not used because it authorizes
// against the caller's possibly stale session — authorization is the caller's
// responsibility.
export async function updateUserRole({
  userId,
  role,
}: {
  userId: string;
  role: "user" | "admin";
}) {
  const { internalAdapter } = await authLib.$context;

  await internalAdapter.updateUser(userId, {
    role,
    updatedAt: new Date(),
  });
}

// Bans must go through Better-Auth rather than Prisma so the user's sessions
// are actually revoked — with secondary storage enabled, sessions live in
// Redis, not the Session table, and only Better-Auth's own APIs delete those
// keys. A bare `banned: true` write leaves the user logged in until their
// session expires. The admin plugin's banUser endpoint is deliberately not
// used: it authorizes against the caller's session snapshot rather than the
// database, and the moderation auto-ban runs without an admin session at all.
// Authorization is the caller's responsibility.

export async function banUser({
  userId,
  reason,
}: {
  userId: string;
  reason?: string;
}) {
  const { internalAdapter } = await authLib.$context;

  await internalAdapter.updateUser(userId, {
    banned: true,
    banReason: reason ?? null,
    updatedAt: new Date(),
  });

  await internalAdapter.deleteSessions(userId);

  await prisma.user.update({
    where: { id: userId },
    data: { bannedAt: new Date() },
  });
}

export async function unbanUser({ userId }: { userId: string }) {
  const { internalAdapter } = await authLib.$context;

  await internalAdapter.updateUser(userId, {
    banned: false,
    banReason: null,
    banExpires: null,
    updatedAt: new Date(),
  });

  await prisma.user.update({
    where: { id: userId },
    data: { bannedAt: null },
  });
}

export async function setActiveSpace({
  userId,
  spaceId,
}: {
  userId: string;
  spaceId: string;
}) {
  return await prisma.spaceMember.update({
    where: {
      spaceId_userId: {
        spaceId: spaceId,
        userId: userId,
      },
    },
    data: {
      lastSelectedAt: new Date(),
    },
  });
}
