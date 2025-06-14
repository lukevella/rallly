import { prisma } from "@rallly/database";

export async function listSpaces({ ownerId }: { ownerId: string }) {
  const spaces = await prisma.space.findMany({
    where: {
      ownerId,
    },
  });

  return spaces;
}

export async function getDefaultSpace({ ownerId }: { ownerId: string }) {
  const space = await prisma.space.findFirst({
    where: {
      ownerId,
    },
  });

  return space;
}
