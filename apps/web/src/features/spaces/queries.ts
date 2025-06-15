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
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!space) {
    throw new Error(`Space with owner ID ${ownerId} not found`);
  }

  return space;
}

export async function getSpace({ id }: { id: string }) {
  const space = await prisma.space.findUnique({
    where: {
      id,
    },
  });

  return space;
}
