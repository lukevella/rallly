import type { SpaceTier, UserRole } from "@rallly/database";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";

export { loginWithEmail } from "@rallly/test-helpers";

export async function createUserInDb({
  email,
  name,
  role = "user",
}: {
  email: string;
  name: string;
  role?: UserRole;
}) {
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        role,
        locale: "en",
        timeZone: "Europe/London",
        emailVerified: true,
      },
    });

    const space = await tx.space.create({
      data: {
        name: "Personal",
        ownerId: user.id,
        tier: "hobby",
      },
    });

    await tx.spaceMember.create({
      data: {
        spaceId: space.id,
        userId: user.id,
        role: "ADMIN",
      },
    });

    return user;
  });
}

export async function createSpaceInDb({
  name,
  ownerId,
  tier,
}: {
  name: string;
  ownerId: string;
  tier: SpaceTier;
}) {
  return prisma.space.create({
    data: {
      name,
      ownerId,
      tier,
    },
  });
}

export async function createTestPoll({
  id,
  title,
  userId,
  spaceId,
  touchedAt,
  hasRecentViews = false,
  hasFutureOptions = false,
}: {
  id: string;
  title: string;
  userId?: string;
  spaceId?: string;
  touchedAt: Date;
  hasRecentViews?: boolean;
  hasFutureOptions?: boolean;
}) {
  const pollData = {
    id,
    title,
    participantUrlId: `${id}-participant`,
    adminUrlId: `${id}-admin`,
    userId,
    spaceId,
    touchedAt,
    ...(hasRecentViews && {
      views: {
        create: {
          viewedAt: dayjs().subtract(15, "day").toDate(),
        },
      },
    }),
    ...(hasFutureOptions && {
      options: {
        create: {
          startTime: dayjs().add(10, "day").toDate(),
          duration: 60,
        },
      },
    }),
  };

  return await prisma.poll.create({
    data: pollData,
  });
}
