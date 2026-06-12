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

export async function updateUserEmail({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  // Better-Auth blocks email updates through api.updateUser because they
  // require verification, which our email change flow has already done by
  // the time this runs. The internal adapter refreshes the cached session
  // data in secondary storage for all of the user's sessions.
  const { internalAdapter } = await authLib.$context;
  await internalAdapter.updateUser(userId, { email });

  // Re-set the session cookie cache for the current device with the
  // updated user data.
  await authLib.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });

  revalidateTag(userProfileTag(userId), "max");
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
