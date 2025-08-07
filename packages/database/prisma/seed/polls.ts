import { faker } from "@faker-js/faker";
import type { VoteType } from "@prisma/client";
import { prisma } from "@rallly/database";
import dayjs from "dayjs";

import { randInt } from "./utils";

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
    // More team-focused titles
    () => "Weekly All-Hands Meeting",
    () => "Sprint Planning Session",
    () => "Product Roadmap Discussion",
    () => "Team Building Event",
    () => "Client Presentation Review",
    () => "Budget Planning Meeting",
    () => "New Feature Brainstorming",
    () => "Performance Review Check-in",
    () => "Company Town Hall",
    () => "Training Workshop Session",
  ];

  return faker.helpers.arrayElement(titleTemplates)();
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
    // More team-focused descriptions
    "Company-wide meeting to discuss strategic initiatives and answer questions from all departments.",
    "Planning session for the next sprint cycle. We'll review backlog items and set priorities.",
    "Review our product roadmap and get alignment on upcoming features and releases.",
    "Fun team activity to improve collaboration and build stronger relationships across departments.",
    "Preparation meeting for the upcoming client presentation. Let's align on key messaging.",
    "Annual budget planning session to discuss resource allocation for the next fiscal year.",
    "Creative session to generate ideas for the new product feature. All perspectives welcome!",
    "Regular one-on-one meetings to discuss performance, goals, and career development.",
    "Quarterly company update covering financial performance, new hires, and strategic direction.",
    "Hands-on workshop to develop new skills and improve team capabilities.",
  ];

  // Randomly select a description
  return faker.helpers.arrayElement(descriptions);
}

async function addTeamParticipantsToPolls() {
  console.info("Adding team members as participants to polls...");
  
  // Get all team members
  const teamMembers = await prisma.user.findMany({
    where: {
      id: {
        in: ["team-owner", "team-admin", "team-member-1", "team-member-2", "team-member-3"]
      }
    }
  });

  // Get team space polls
  const teamPolls = await prisma.poll.findMany({
    where: {
      spaceId: "team-space-1"
    },
    include: {
      options: true,
      participants: true
    }
  });

  // Add team members as participants to some polls
  for (const poll of teamPolls) {
    // Skip if poll already has team participants
    const existingTeamParticipants = poll.participants.filter(p => 
      teamMembers.some(tm => tm.email === p.email)
    );
    
    if (existingTeamParticipants.length > 0) continue;

    // Add 2-4 random team members as participants
    const numParticipants = randInt(3, 2);
    const selectedMembers = faker.helpers.arrayElements(teamMembers, numParticipants);
    
    for (const member of selectedMembers) {
      const participant = await prisma.participant.create({
        data: {
          pollId: poll.id,
          name: member.name,
          email: member.email,
        }
      });

      // Add votes for this participant
      const voteData = poll.options.map((option) => ({
        id: faker.random.alpha(10),
        optionId: option.id,
        participantId: participant.id,
        pollId: poll.id,
        type: faker.helpers.arrayElement(["yes", "no", "ifNeedBe"]) as VoteType,
      }));

      if (voteData.length > 0) {
        await prisma.vote.createMany({
          data: voteData,
        });
      }
    }
  }

  console.info(`✓ Added team participation to polls`);
}

async function createPollForUser({
  userId,
  spaceId,
}: {
  userId: string;
  spaceId: string;
}) {
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
      space: {
        connect: {
          id: spaceId,
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
        create: Array.from({ length: randInt(10) }).map(() => ({
          name: faker.name.fullName(),
          email: faker.internet.email(),
        })),
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
  if (voteData.length > 0) {
    await prisma.vote.createMany({
      data: voteData,
    });
  }

  return poll;
}

async function seedTeamPolls() {
  console.info("Seeding team polls...");
  const teamSpace = await prisma.space.findUnique({
    where: { id: "team-space-1" },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!teamSpace) {
    console.warn("Team space not found, skipping team polls");
    return;
  }

  // Create polls from different team members
  const teamMemberIds = teamSpace.members.map((member) => member.userId);
  
  // Create more realistic team polls
  const teamPollPromises = [
    // Owner creates strategic polls
    ...Array.from({ length: 8 }).map(() =>
      createPollForUser({ 
        userId: "team-owner", 
        spaceId: teamSpace.id 
      }),
    ),
    // Admin creates operational polls
    ...Array.from({ length: 6 }).map(() =>
      createPollForUser({ 
        userId: "team-admin", 
        spaceId: teamSpace.id 
      }),
    ),
    // Members create various polls
    ...Array.from({ length: 4 }).map(() =>
      createPollForUser({ 
        userId: "team-member-1", 
        spaceId: teamSpace.id 
      }),
    ),
    ...Array.from({ length: 3 }).map(() =>
      createPollForUser({ 
        userId: "team-member-2", 
        spaceId: teamSpace.id 
      }),
    ),
    ...Array.from({ length: 2 }).map(() =>
      createPollForUser({ 
        userId: "team-member-3", 
        spaceId: teamSpace.id 
      }),
    ),
  ];

  await Promise.all(teamPollPromises);
  console.info(`✓ Seeded ${teamPollPromises.length} team polls`);
  
  // Add cross-team participation
  await addTeamParticipantsToPolls();
}

export async function seedPolls(userId: string) {
  console.info(`Seeding polls for user ${userId}...`);
  
  // Handle team space separately
  if (userId === "team-owner") {
    await seedTeamPolls();
    return;
  }

  // Skip other team members as they're handled in team polling
  const teamMemberIds = ["team-admin", "team-member-1", "team-member-2", "team-member-3"];
  if (teamMemberIds.includes(userId)) {
    console.info(`Skipping individual polls for team member ${userId} (included in team polls)`);
    return;
  }

  const space = await prisma.space.findFirst({
    where: {
      ownerId: userId,
    },
  });

  if (!space) {
    throw new Error(`No space found for user ${userId}`);
  }

  const pollPromises = Array.from({ length: 20 }).map(() =>
    createPollForUser({ userId, spaceId: space.id }),
  );

  await Promise.all(pollPromises);

  console.info(`✓ Seeded polls for ${userId}`);
}
