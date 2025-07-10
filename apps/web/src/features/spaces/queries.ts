import { requireUserAbility } from "@/auth/queries";
import { accessibleBy } from "@casl/prisma";
import { prisma } from "@rallly/database";

export async function listSpaces() {
  const { ability } = await requireUserAbility();
  const spaces = await prisma.space.findMany({
    where: accessibleBy(ability).Space,
  });

  return spaces;
}

export async function getDefaultSpace() {
  const { user } = await requireUserAbility();
  const space = await prisma.space.findFirst({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!space) {
    throw new Error(`Space with owner ID ${user.id} not found`);
  }

  return space;
}

export async function getSpace({ id }: { id: string }) {
  const { ability } = await requireUserAbility();
  return await prisma.space.findFirst({
    where: {
      AND: [accessibleBy(ability).Space, { id }],
    },
  });
}
