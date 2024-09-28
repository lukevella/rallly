import { faker } from "@faker-js/faker";
import { PrismaClient, VoteType } from "@prisma/client";
import dayjs from "dayjs";

const prisma = new PrismaClient();

const randInt = (max = 1, floor = 0) => {
  return Math.round(Math.random() * max) + floor;
};

function generateTitle() {
  const titleTemplates = [
    () => `${faker.company.catchPhrase()} Meeting`,
    () => `${faker.commerce.department()} Team Sync`,
    () => `Q${faker.datatype.number({ min: 1, max: 4 })} Planning`,
    () => `${faker.name.jobArea()} Workshop`,
    () => `Project ${faker.word.adjective()} Update`,
    () => `${faker.company.bsBuzz()} Strategy Session`,
    () => faker.company.catchPhrase(),
    () => `${faker.name.jobType()} Interview`,
    () => `${faker.commerce.productAdjective()} Product Review`,
    () => `Team ${faker.word.verb()} Day`,
  ];

  return faker.helpers.arrayElement(titleTemplates)();
}

async function createPollForUser(userId: string) {
  const duration = 60 * randInt(8);
  let cursor = dayjs().add(randInt(30), "day").second(0).minute(0);
  const numberOfOptions = randInt(5, 2); // Reduced for realism

  const poll = await prisma.poll.create({
    include: {
      participants: true,
      options: true,
    },
    data: {
      id: faker.random.alpha(10),
      title: generateTitle(),
      description: generateDescription(),
      location: faker.address.streetAddress(),
      deadline: faker.date.future(),
      user: {
        connect: {
          id: userId,
        },
      },
      status: faker.helpers.arrayElement(["live", "paused", "finalized"]),
      timeZone: duration !== 0 ? "Europe/London" : undefined,
      options: {
        create: Array.from({ length: numberOfOptions }).map(() => {
          const startTime = cursor.toDate();
          cursor = cursor.add(randInt(72, 1), "hour");
          return {
            startTime,
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

  // Generate vote data for all participants and options
  const voteData = poll.participants.flatMap((participant) =>
    poll.options.map((option) => ({
      id: faker.random.alpha(10),
      optionId: option.id,
      participantId: participant.id,
      pollId: poll.id,
      type: faker.helpers.arrayElement(["yes", "no", "ifNeedBe"]) as VoteType,
    })),
  );

  // Create all votes in a single query
  await prisma.vote.createMany({
    data: voteData,
  });

  return poll;
}

// Function to generate realistic descriptions
function generateDescription() {
  const descriptions = [
    "Discuss the quarterly results and strategize for the upcoming quarter. Please come prepared with your reports.",
    "Team meeting to align on project goals and timelines. Bring your ideas and feedback.",
    "An informal catch-up to discuss ongoing projects and any roadblocks. Open to all team members.",
    "Monthly review of our marketing strategies and performance metrics. Let's brainstorm new ideas.",
    "A brief meeting to go over the new software updates and how they will impact our workflow.",
    "Discussion on the upcoming product launch and marketing strategies. Your input is valuable!",
    "Weekly sync to check in on project progress and address any concerns. Please be on time.",
    "A brainstorming session for the new campaign. All creative minds are welcome!",
    "Review of the last sprint and planning for the next one. Let's ensure we're on track.",
    "An open forum for team members to share updates and challenges. Everyone is encouraged to speak up.",
  ];

  // Randomly select a description
  return faker.helpers.arrayElement(descriptions);
}

async function main() {
  // Create some users
  // Create some users and polls
  const freeUser = await prisma.user.create({
    data: {
      id: "free-user",
      name: "Dev User",
      email: "dev@rallly.co",
      timeZone: "America/New_York",
    },
  });

  const proUser = await prisma.user.create({
    data: {
      id: "pro-user",
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

  await Promise.all(
    [freeUser, proUser, proUserLegacy].map(async (user) => {
      Array.from({ length: 20 }).forEach(async () => {
        await createPollForUser(user.id);
      });
      console.info(`✓ Added ${user.email}`);
    }),
  );
  console.info(`✓ Added polls for ${freeUser.email}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
