import { prisma } from "@rallly/database";

import { getServerSession } from "@/auth";

export async function getGuestPolls() {
  const session = await getServerSession();
  const user = session?.user;
  const guestId = !user?.email ? user?.id : null;

  if (!guestId) {
    return [];
  }

  const recentlyCreatedPolls = await prisma.poll.findMany({
    where: {
      guestId,
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
