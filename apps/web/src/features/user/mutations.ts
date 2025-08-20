import type { TimeFormat } from "@rallly/database";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";

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
  emailVerified?: Date;
  image?: string;
  timeZone?: string;
  timeFormat?: TimeFormat;
  locale?: string;
  weekStart?: number;
}) {
  const { user, space } = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
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

    const space = await tx.space.create({
      data: {
        ownerId: user.id,
        name: "Personal",
      },
    });

    await tx.spaceMember.create({
      data: {
        spaceId: space.id,
        userId: user.id,
        role: "ADMIN",
        lastSelectedAt: new Date(),
      },
    });

    return { user, space };
  });

  posthog?.groupIdentify({
    groupType: "space",
    groupKey: space.id,
    properties: {
      name: space.name,
      member_count: 1,
      seat_count: 1,
      tier: "hobby",
    },
  });

  return user;
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
