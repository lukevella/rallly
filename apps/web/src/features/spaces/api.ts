import { prisma } from "@rallly/database";
import { requireUserAbility } from "@/auth/queries";

export async function getActiveSpace() {
  const { user } = await requireUserAbility();
  if (user.activeSpaceId) {
    const space = await prisma.space.findFirst({
      where: {
        id: user.activeSpaceId,
      },
    });

    if (space) {
      return space;
    }

    console.warn(
      `User ${user.id} has an active space ID ${user.activeSpaceId} that does not exist or is no longer accessible`,
    );
  }

  const space = await prisma.space.findFirst({
    where: {
      ownerId: user.id,
    },
  });

  if (!space) {
    throw new Error("User does not have an active space");
  }

  return space;
}
