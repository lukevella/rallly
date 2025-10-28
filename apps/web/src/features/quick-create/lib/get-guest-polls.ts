import { prisma } from "@rallly/database";

import { getSession } from "@/lib/auth";

export async function getGuestPolls() {
  const session = await getSession();

  if (session?.user?.isGuest !== true) {
    return [];
  }

  const recentlyCreatedPolls = await prisma.poll.findMany({
    where: {
      guestId: session.legacy ? session.user.id : undefined,
      userId: session.legacy ? undefined : session.user.id,
      deleted: false,
    },
    select: {
      id: true,
      title: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 3,
  });

  return recentlyCreatedPolls;
}
