import { prisma } from "@rallly/database";
import "server-only";

export async function canUserManagePoll(
  user: {
    id: string;
    isGuest: boolean;
  },
  poll: {
    userId?: string | null;
    guestId?: string | null;
    spaceId?: string | null;
  },
) {
  if (user.isGuest) {
    console.log("user is guest");
    // guest user is owner
    return poll.guestId === user.id;
  }

  if (poll.userId && !user.isGuest && poll.userId === user.id) {
    console.log("user is owner");
    // user is owner
    return true;
  }

  if (poll.spaceId && !user.isGuest) {
    console.log("checking if space member");
    const space = await prisma.spaceMember.findUnique({
      where: {
        spaceId_userId: {
          spaceId: poll.spaceId,
          userId: user.id,
        },
      },
    });

    if (space) {
      // user is not a member of this space
      return true;
    }
  }

  return false;
}
