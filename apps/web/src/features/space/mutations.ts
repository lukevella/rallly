import { prisma } from "@rallly/database";

export async function createSpace({
  name = "Personal",
  ownerId,
}: {
  name?: string;
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

  return space;
}
