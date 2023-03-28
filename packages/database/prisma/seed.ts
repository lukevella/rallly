import { faker } from "@faker-js/faker";
import { PrismaClient, VoteType } from "@prisma/client";

const prisma = new PrismaClient();

const randInt = (max = 1, floor = 0) => {
  return Math.round(Math.random() * max) + floor;
};

async function main() {
  // Create some users
  const user = await prisma.user.create({
    data: {
      name: faker.name.fullName(),
      email: faker.internet.email(),
    },
  });

  // Create some polls
  const polls = await Promise.all(
    Array.from({ length: 20 }).map(async () => {
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
          type: "date",
          user: {
            connect: {
              id: user.id,
            },
          },
          timeZone: "America/New_York",
          options: {
            create: faker.date
              .betweens(
                Date.now(),
                Date.now() + 1000 * 60 * 60 * 24 * 30,
                randInt(16, 1),
              ) //
              .map((date) => {
                return {
                  value: date.toISOString().substring(0, 10),
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
            randomNumber > 90 ? "ifNeedBe" : randomNumber > 50 ? "yes" : "no";
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

  console.info(`Seeded database with user: ${user.email}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
