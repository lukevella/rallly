import dayjs from "dayjs";
import { prisma } from "../client";

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
    },
  });

  const proUser = await prisma.user.upsert({
    where: { email: "dev+pro@rallly.co" },
    update: {},
    create: {
      id: "pro-user",
      name: "Pro User",
      email: "dev+pro@rallly.co",
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
        },
      },
    },
  });
  console.info(`✓ Seeded user ${freeUser.email}`);
  console.info(`✓ Seeded user ${proUser.email}`);

  return [freeUser, proUser];
}
