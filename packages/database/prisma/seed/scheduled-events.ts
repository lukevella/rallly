import { faker } from "@faker-js/faker";
import type { ScheduledEventInviteStatus } from "@prisma/client";
import { ScheduledEventStatus } from "@prisma/client"; // Ensure Prisma is imported
import { prisma } from "@rallly/database";
import dayjs from "dayjs";
import { randInt } from "./utils";

// Realistic event titles and descriptions
function generateEventDetails() {
  const titles = [
    "Team Sync Meeting",
    "Product Strategy Session",
    "Design Review",
    "Engineering Standup",
    "Client Check-in Call",
    "Marketing Campaign Kickoff",
    "Sales Pipeline Review",
    "HR Training Workshop",
    "Finance Budget Planning",
    "All Hands Company Update",
    "Sprint Retrospective",
    "User Research Debrief",
    "Technical Deep Dive",
    "Content Calendar Planning",
    "Partnership Discussion",
  ];
  const descriptions = [
    "Discussing project updates and blockers.",
    "Aligning on the product roadmap for the next quarter.",
    "Gathering feedback on the latest UI mockups.",
    "Quick daily updates from the engineering team.",
    "Reviewing progress and addressing client concerns.",
    "Launching the new social media campaign.",
    "Analyzing the current sales funnel and opportunities.",
    "Mandatory compliance training session.",
    "Meeting to finalize budget decisions across different departments.",
    "Sharing company performance and upcoming goals.",
    "Reflecting on the past sprint, celebrating successes, and identifying areas for improvement.",
    "Sharing key insights gathered from recent user research sessions.",
    "Exploring the architecture of the new microservice.",
    "Planning blog posts and social media content for the month.",
    "Exploring potential collaboration opportunities with external partners.",
    "Team building activity to foster collaboration.",
    "Workshop on improving presentation skills.",
    "Onboarding session for new hires.",
    "Reviewing customer feedback and planning improvements.",
    "Brainstorming session for new feature ideas.",
  ];

  return {
    title: faker.helpers.arrayElement(titles),
    description: faker.helpers.arrayElement(descriptions),
  };
}

async function createScheduledEventForUser({
  userId,
  spaceId,
}: {
  userId: string;
  spaceId: string;
}) {
  const { title, description } = generateEventDetails();
  const isAllDay = Math.random() < 0.3; // ~30% chance of being all-day

  let startTime: Date;
  let endTime: Date | null;

  if (isAllDay) {
    const startDate = dayjs(
      faker.datatype.boolean() ? faker.date.past(1) : faker.date.soon(30),
    )
      .startOf("day")
      .toDate();
    startTime = startDate;

    // Decide if it's a multi-day event
    const isMultiDay = Math.random() < 0.2; // ~20% chance of multi-day
    if (isMultiDay) {
      const durationDays = faker.datatype.number({ min: 1, max: 3 });
      // End date is the start of the day *after* the last full day
      endTime = dayjs(startDate)
        .add(durationDays + 1, "day")
        .toDate();
    } else {
      // Single all-day event ends at the start of the next day
      endTime = dayjs(startDate).add(1, "day").toDate();
    }
  } else {
    // Generate times for non-all-day events
    startTime = dayjs(
      faker.datatype.boolean() ? faker.date.past(1) : faker.date.soon(30),
    )
      .second(faker.helpers.arrayElement([0, 15, 30, 45])) // Add some variance
      .minute(faker.helpers.arrayElement([0, 15, 30, 45]))
      .hour(faker.datatype.number({ min: 8, max: 20 })) // Wider range for hours
      .toDate();
    const durationMinutes = faker.helpers.arrayElement([30, 60, 90, 120, 180]); // Longer durations possible
    endTime = dayjs(startTime).add(durationMinutes, "minute").toDate();
  }

  // Use only valid statuses from the schema
  const status = faker.helpers.arrayElement<ScheduledEventStatus>([
    ScheduledEventStatus.confirmed,
    ScheduledEventStatus.canceled,
  ]);
  const timeZone = faker.address.timeZone();

  await prisma.scheduledEvent.create({
    data: {
      title,
      uid: faker.datatype.uuid(),
      description,
      start: startTime, // Use correct model field name 'start'
      end: endTime, // Use correct model field name 'end'
      timeZone,
      status, // Assign the randomly selected valid status
      user: {
        connect: { id: userId },
      }, // Connect to existing user
      space: {
        connect: { id: spaceId },
      },
      allDay: isAllDay,
      location: faker.datatype.boolean()
        ? faker.address.streetAddress()
        : undefined,
      // Add invites (optional, example below)
      invites: {
        create: Array.from({ length: randInt(5, 0) }).map(() => ({
          inviteeEmail: faker.internet.email(),
          inviteeName: faker.name.fullName(),
          inviteeTimeZone: faker.address.timeZone(),
          status: faker.helpers.arrayElement<ScheduledEventInviteStatus>([
            "accepted",
            "declined",
            "tentative",
            "pending",
          ]),
        })),
      },
    },
  });
}

async function seedTeamEvents() {
  console.info("Seeding team scheduled events...");
  const teamSpace = await prisma.space.findUnique({
    where: { id: "team-space-1" },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  if (!teamSpace) {
    console.warn("Team space not found, skipping team events");
    return;
  }

  // Create events from different team members
  const teamEventPromises = [
    // Owner creates important company events
    ...Array.from({ length: 12 }).map(() =>
      createScheduledEventForUser({ 
        userId: "team-owner", 
        spaceId: teamSpace.id 
      }),
    ),
    // Admin creates operational events
    ...Array.from({ length: 10 }).map(() =>
      createScheduledEventForUser({ 
        userId: "team-admin", 
        spaceId: teamSpace.id 
      }),
    ),
    // Members create department/project events
    ...Array.from({ length: 6 }).map(() =>
      createScheduledEventForUser({ 
        userId: "team-member-1", 
        spaceId: teamSpace.id 
      }),
    ),
    ...Array.from({ length: 5 }).map(() =>
      createScheduledEventForUser({ 
        userId: "team-member-2", 
        spaceId: teamSpace.id 
      }),
    ),
    ...Array.from({ length: 4 }).map(() =>
      createScheduledEventForUser({ 
        userId: "team-member-3", 
        spaceId: teamSpace.id 
      }),
    ),
  ];

  await Promise.all(teamEventPromises);
  console.info(`✓ Seeded ${teamEventPromises.length} team events`);
}

export async function seedScheduledEvents(userId: string) {
  console.info(`Seeding scheduled events for user ${userId}...`);
  
  // Handle team space separately
  if (userId === "team-owner") {
    await seedTeamEvents();
    return;
  }

  // Skip other team members as they're handled in team events
  const teamMemberIds = ["team-admin", "team-member-1", "team-member-2", "team-member-3"];
  if (teamMemberIds.includes(userId)) {
    console.info(`Skipping individual events for team member ${userId} (included in team events)`);
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

  const eventPromises = Array.from({ length: 15 }).map(() =>
    createScheduledEventForUser({ userId, spaceId: space.id }),
  );

  await Promise.all(eventPromises);

  console.info(`✓ Seeded scheduled events for ${userId}`);
}
