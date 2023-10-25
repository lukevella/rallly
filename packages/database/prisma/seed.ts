import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

const randInt = (max = 1, floor = 0) => {
  return Math.round(Math.random() * max) + floor;
};

async function createPollsForUser(userId: string) {
  // Create some polls
  const polls = await Promise.all(
    Array.from({ length: 20 }).map(async (_, i) => {
      // create some polls with no duration (all day) and some with a random duration.
      const duration = i % 2 === 0 ? 15 * randInt(8) : 0;
      const poll = await prisma.poll.create({
        include: {
          participants: true,
          options: true,
        },
        data: {
          id: faker.random.alpha(10),
          title: `${faker.animal.cat()} meetup - ${faker.date.month()}`,
          description: faker.lorem.paragraph(),
          location: faker.address.streetAddress(),
          deadline: faker.date.future(),
          user: {
            connect: {
              id: userId,
            },
          },
          timeZone: duration !== 0 ? "America/New_York" : undefined,
          options: {
            create: faker.date
              .betweens(
                Date.now(),
                Date.now() + 1000 * 60 * 60 * 24 * 30,
                randInt(30, 1),
              )
              .map((date) => {
                // rounded to nearest 15 minutes
                date.setMinutes(Math.round(date.getMinutes() / 15) * 15);
                date.setSeconds(0);
                return {
                  start: date,
                  duration,
                };
              }),
          },
          participants: {
            create: Array.from({ length: Math.round(Math.random() * 10) }).map(
              () => ({
                name: faker.name.fullName(),
                email: faker.internet.email(),
              }),
            ),
          },
          adminUrlId: faker.random.alpha(10),
          participantUrlId: faker.random.alpha(10),
        },
      });
      return poll;
    }),
  );

  // Create some votes
  for (const poll of polls) {
    for (const participant of poll.participants) {
      await prisma.vote.createMany({
        data: poll.options.map((option) => {
          const randomNumber = randInt(100);
          const vote =
            randomNumber > 95 ? "ifNeedBe" : randomNumber > 50 ? "yes" : "no";
          return {
            participantId: participant.id,
            pollId: poll.id,
            optionId: option.id,
            type: vote,
          };
        }),
      });
    }
  }

  for (const poll of polls) {
    const commentCount = randInt(3);
    if (commentCount) {
      await prisma.comment.createMany({
        data: Array.from({ length: commentCount }).map(() => ({
          pollId: poll.id,
          authorName: faker.name.fullName(),
          content: faker.lorem.sentence(),
        })),
      });
    }
  }
}

async function main() {
  // Create some users
  const freeUser = await prisma.user.create({
    data: {
      name: "Dev User",
      email: "dev@rallly.co",
      timeZone: "America/New_York",
    },
  });

  const proUser = await prisma.user.create({
    data: {
      name: "Pro User",
      email: "dev+pro@rallly.co",
      customerId: "cus_123",
      subscription: {
        create: {
          id: "sub_123",
          active: true,
          priceId: "price_123",
          periodStart: new Date(),
          periodEnd: dayjs().add(1, "year").toDate(),
        },
      },
    },
  });

  const proUserLegacy = await prisma.user.create({
    data: {
      name: "Pro User Legacy",
      email: "dev+prolegacy@rallly.co",
    },
  });

  await prisma.userPaymentData.create({
    data: {
      userId: proUserLegacy.id,
      status: "active",
      endDate: dayjs().add(1, "year").toDate(),
      planId: "pro_123",
      updateUrl: "https://example.com/update",
      cancelUrl: "https://example.com/cancel",
      subscriptionId: "sub_123",
    },
  });

  [freeUser.id, proUser.id, proUserLegacy.id].forEach(async (userId) => {
    await createPollsForUser(userId);
  });

  console.info(`Seeded data`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
