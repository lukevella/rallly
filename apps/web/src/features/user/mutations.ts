import { prisma, type TimeFormat } from "@rallly/database";

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
        role: "OWNER",
      },
    });

    await tx.user.update({
      where: {
        id: user.id,
      },
      data: {
        activeSpaceId: space.id,
      },
    });

    return user;
  });
}
