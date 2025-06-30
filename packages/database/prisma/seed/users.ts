import { prisma } from "@rallly/database";
import dayjs from "dayjs";

export async function seedUsers() {
  console.info("Seeding users...");
  const freeUser = await prisma.user.upsert({
    where: { email: "dev@rallly.co" },
    update: {},
    create: {
      id: "free-user",
      name: "Dev User",
      email: "dev@rallly.co",
      timeZone: "America/New_York",
      spaces: {
        create: {
          id: "space-1",
          name: "Personal",
        },
      },
    },
  });

  await prisma.spaceMember.create({
    data: {
      spaceId: "space-1",
      userId: "free-user",
      role: "OWNER",
    },
  });

  const proUser = await prisma.user.upsert({
    where: { email: "dev+pro@rallly.co" },
    update: {},
    create: {
      id: "pro-user",
      name: "Pro User",
      email: "dev+pro@rallly.co",
      spaces: {
        create: {
          id: "space-2",
          name: "Personal",
        },
      },
      subscription: {
        create: {
          id: "sub_123",
          currency: "usd",
          amount: 700,
          interval: "month",
          status: "active",
          active: true,
          priceId: "price_123",
          periodStart: new Date(),
          periodEnd: dayjs().add(1, "month").toDate(),
          spaceId: "space-2",
        },
      },
    },
  });

  await prisma.spaceMember.create({
    data: {
      spaceId: "space-2",
      userId: "pro-user",
      role: "OWNER",
    },
  });

  console.info(`✓ Seeded user ${freeUser.email}`);
  console.info(`✓ Seeded user ${proUser.email}`);

  return [freeUser, proUser];
}
