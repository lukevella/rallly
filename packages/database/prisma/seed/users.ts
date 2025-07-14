import { prisma } from "@rallly/database";
import dayjs from "dayjs";

async function createUser({
  id,
  name,
  email,
  timeZone,
  space,
}: {
  id: string;
  name: string;
  email: string;
  timeZone: string;
  space: {
    id: string;
    name: string;
    isPro: boolean;
  };
}) {
  const user = await prisma.user.create({
    data: {
      id,
      name,
      email,
      timeZone,
      spaces: {
        create: {
          id: space.id,
          name: space.name,
        },
      },
    },
  });

  if (space.isPro) {
    await prisma.subscription.create({
      data: {
        id: "sub-1",
        spaceId: space.id,
        userId: user.id,
        active: true,
        amount: 700,
        currency: "USD",
        interval: "month",
        periodStart: new Date(),
        periodEnd: dayjs().add(1, "month").toDate(),
        priceId: "price_1M6ZJZGZJZJZJZJZJZJZJZJZ",
        status: "active",
      },
    });
  }

  await prisma.spaceMember.create({
    data: {
      spaceId: space.id,
      userId: id,
      role: "OWNER",
    },
  });

  await prisma.user.update({
    where: { id },
    data: {
      activeSpaceId: space.id,
    },
  });

  return user;
}

export async function seedUsers() {
  console.info("Seeding users...");
  const freeUser = await createUser({
    id: "free-user",
    name: "Dev User",
    email: "dev@rallly.co",
    timeZone: "America/New_York",
    space: {
      id: "space-1",
      name: "Personal",
      isPro: false,
    },
  });

  const proUser = await createUser({
    id: "pro-user",
    name: "Pro User",
    email: "dev+pro@rallly.co",
    timeZone: "America/New_York",
    space: {
      id: "space-2",
      name: "Personal",
      isPro: true,
    },
  });

  console.info(`✓ Seeded user ${freeUser.email}`);
  console.info(`✓ Seeded user ${proUser.email}`);

  return [freeUser, proUser];
}
