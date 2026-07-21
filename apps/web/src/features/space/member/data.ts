import "server-only";

import { prisma } from "@rallly/database";

export async function getInvite(inviteId: string) {
  return prisma.spaceMemberInvite.findUnique({
    where: { id: inviteId },
    select: {
      id: true,
      spaceId: true,
    },
  });
}
