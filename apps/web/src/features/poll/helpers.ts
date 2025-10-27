import { prisma } from "@rallly/database";
import "server-only";

export async function canUserManagePoll(
  user: {
    id: string;
    isGuest: boolean;
    isLegacyGuest: boolean;
  },
  poll: {
    userId?: string | null;
    guestId?: string | null;
    spaceId?: string | null;
  },
) {
  if (user.isLegacyGuest) {
    // guest user is owner
    return poll.guestId === user.id;
  }

  if (poll.userId && poll.userId === user.id) {
    // user is owner
    return true;
  }

  if (poll.spaceId) {
    const space = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: poll.spaceId,
          userId: user.id,
        },
      },
    });

    if (space) {
      // user a member of this space
      return true;
    }
  }

  return false;
}
