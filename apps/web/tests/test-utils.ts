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
        timeFormat: "hours24",
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

/**
 * Upgrades a space to pro with an active subscription. Seat totals are
 * derived from the subscription quantity in cloud-hosted mode, so tests
 * that exercise seat limits must seed one.
 */
export async function upgradeSpaceToPro({
  spaceId,
  userId,
  seats,
}: {
  spaceId: string;
  userId: string;
  seats: number;
}) {
  await prisma.$transaction([
    prisma.space.update({
      where: { id: spaceId },
      data: { tier: "pro" },
    }),
    prisma.subscription.create({
      data: {
        id: `sub_test_${spaceId}`,
        priceId: "price_test",
        quantity: seats,
        subscriptionItemId: `si_test_${spaceId}`,
        amount: 700 * seats,
        status: "active",
        active: true,
        currency: "USD",
        interval: "month",
        periodStart: new Date(),
        periodEnd: dayjs().add(1, "month").toDate(),
        userId,
        spaceId,
      },
    }),
  ]);
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
  updatedAt,
  hasFutureOptions = false,
  participantActiveAt,
  commentCreatedAt,
}: {
  id: string;
  title: string;
  userId?: string;
  spaceId?: string;
  updatedAt: Date;
  hasFutureOptions?: boolean;
  participantActiveAt?: Date;
  commentCreatedAt?: Date;
}) {
  const pollData = {
    id,
    title,
    participantUrlId: `${id}-participant`,
    adminUrlId: `${id}-admin`,
    userId,
    spaceId,
    updatedAt,
    ...(participantActiveAt && {
      participants: {
        create: {
          name: "Test Participant",
          createdAt: participantActiveAt,
          updatedAt: participantActiveAt,
        },
      },
    }),
    ...(commentCreatedAt && {
      comments: {
        create: {
          content: "Test comment",
          authorName: "Test Commenter",
          createdAt: commentCreatedAt,
        },
      },
    }),
    ...(hasFutureOptions && {
      kind: "time" as const,
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
