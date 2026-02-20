import { prisma } from "@rallly/database";
import { getActiveSpaceForUser } from "@/features/space/data";
import { privateProcedure, router } from "../trpc";

export const space = router({
  members: privateProcedure.query(async ({ ctx }) => {
    const activeSpace = await getActiveSpaceForUser(ctx.user.id);

    if (!activeSpace) {
      return [];
    }

    const members = await prisma.spaceMember.findMany({
      where: {
        spaceId: activeSpace.id,
      },
      select: {
        userId: true,
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return members.map((member) => ({
      userId: member.userId,
      name: member.user.name,
      image: member.user.image ?? undefined,
    }));
  }),
});
