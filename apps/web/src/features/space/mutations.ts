import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";

export async function createSpace({
  name,
  ownerId,
}: {
  name: string;
  ownerId: string;
}) {
  const space = await prisma.space.create({
    data: {
      name,
      ownerId,
      members: {
        create: {
          userId: ownerId,
          role: "ADMIN",
          lastSelectedAt: new Date(),
        },
      },
    },
  });

  posthog?.groupIdentify({
    groupType: "space",
    groupKey: space.id,
    properties: {
      name: space.name,
      member_count: 1,
      seat_count: 1,
      tier: "hobby",
    },
  });

  posthog?.capture({
    distinctId: ownerId,
    event: "space_created",
    properties: {
      space_id: space.id,
      space_name: space.name,
    },
    groups: {
      space: space.id,
    },
  });

  return space;
}
