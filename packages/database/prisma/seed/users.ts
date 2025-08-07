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
        subscriptionItemId: "subitem-1",
        quantity: 1,
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
      role: "ADMIN",
    },
  });

  return user;
}

async function createTeamSpace() {
  console.info("Creating team space...");
  
  // Create team owner first
  const teamOwner = await prisma.user.create({
    data: {
      id: "team-owner",
      name: "Sarah Johnson",
      email: "sarah@rallly.co",
      timeZone: "America/New_York",
    },
  });

  // Then create the team space
  const teamSpace = await prisma.space.create({
    data: {
      id: "team-space-1",
      name: "Acme Corp Team",
      ownerId: teamOwner.id,
    },
  });

  const teamMembers = await Promise.all([
    prisma.user.create({
      data: {
        id: "team-admin",
        name: "Michael Chen",
        email: "michael@rallly.co",
        timeZone: "America/Los_Angeles",
      },
    }),
    prisma.user.create({
      data: {
        id: "team-member-1",
        name: "Emily Rodriguez",
        email: "emily@rallly.co",
        timeZone: "America/Chicago",
      },
    }),
    prisma.user.create({
      data: {
        id: "team-member-2",
        name: "James Wilson",
        email: "james@rallly.co",
        timeZone: "Europe/London",
      },
    }),
    prisma.user.create({
      data: {
        id: "team-member-3",
        name: "Lisa Park",
        email: "lisa@rallly.co",
        timeZone: "Asia/Tokyo",
      },
    }),
  ]);

  // Add team members to space with different roles
  await Promise.all([
    prisma.spaceMember.create({
      data: {
        spaceId: teamSpace.id,
        userId: teamOwner.id,
        role: "ADMIN",
        lastSelectedAt: new Date(),
      },
    }),
    prisma.spaceMember.create({
      data: {
        spaceId: teamSpace.id,
        userId: "team-admin",
        role: "ADMIN",
        lastSelectedAt: new Date(),
      },
    }),
    prisma.spaceMember.create({
      data: {
        spaceId: teamSpace.id,
        userId: "team-member-1",
        role: "MEMBER",
        lastSelectedAt: new Date(),
      },
    }),
    prisma.spaceMember.create({
      data: {
        spaceId: teamSpace.id,
        userId: "team-member-2",
        role: "MEMBER",
        lastSelectedAt: new Date(),
      },
    }),
    prisma.spaceMember.create({
      data: {
        spaceId: teamSpace.id,
        userId: "team-member-3",
        role: "MEMBER",
        lastSelectedAt: new Date(),
      },
    }),
  ]);

  // Add Pro subscription for the team space
  await prisma.subscription.create({
    data: {
      id: "team-sub-1",
      spaceId: teamSpace.id,
      userId: teamOwner.id,
      subscriptionItemId: "team-subitem-1",
      quantity: 5, // Team of 5
      active: true,
      amount: 2800, // $28 for team plan
      currency: "USD",
      interval: "month",
      periodStart: new Date(),
      periodEnd: dayjs().add(1, "month").toDate(),
      priceId: "price_team_monthly",
      status: "active",
    },
  });

  console.info(`✓ Seeded team space with ${[teamOwner, ...teamMembers].length} members`);
  
  return [teamOwner, ...teamMembers];
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

  // Create team space with multiple members
  const teamMembers = await createTeamSpace();

  console.info(`✓ Seeded user ${freeUser.email}`);
  console.info(`✓ Seeded user ${proUser.email}`);

  return [freeUser, proUser, ...teamMembers];
}
