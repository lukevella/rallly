import { prisma } from "@rallly/database";

export async function createSpace({
  ownerId,
  name,
}: {
  ownerId: string;
  name: string;
}) {
  return await prisma.space.create({
    data: {
      ownerId,
      name,
      members: {
        create: {
          userId: ownerId,
          role: "OWNER",
        },
      },
    },
  });
}
