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
