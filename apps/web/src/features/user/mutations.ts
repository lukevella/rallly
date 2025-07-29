import type { TimeFormat } from "@rallly/database";
import { prisma } from "@rallly/database";

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
  return await prisma.$transaction(async (tx) => {
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
      },
    });

    await tx.spaceMember.update({
      where: {
        spaceId_userId: {
          spaceId: space.id,
          userId: user.id,
        },
      },
      data: {
        lastSelectedAt: new Date(),
      },
    });

    return user;
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
