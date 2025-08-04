import type { Page } from "@playwright/test";
import type { UserRole } from "@rallly/database";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import { LoginPage } from "./login-page";

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
        emailVerified: new Date(),
      },
    });

    const space = await tx.space.create({
      data: {
        name: "Personal",
        ownerId: user.id,
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

export async function createSpaceWithSubscription({
  name,
  ownerId,
  subscriptionId = "sub_test",
}: {
  name: string;
  ownerId: string;
  subscriptionId?: string;
}) {
  return await prisma.space.create({
    data: {
      name,
      ownerId,
      subscription: {
        create: {
          id: subscriptionId,
          priceId: "price_test",
          amount: 1000,
          status: "active",
          active: true,
          subscriptionItemId: "si_test",
          currency: "USD",
          interval: "month",
          periodStart: new Date(),
          periodEnd: dayjs().add(30, "day").toDate(),
          userId: ownerId,
        },
      },
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

export async function loginWithEmail(page: Page, { email }: { email: string }) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login({
    email,
  });
}
