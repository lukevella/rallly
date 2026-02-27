import { prisma } from "@rallly/database";
import { createSpaceDTO } from "@/features/space/data";
import type { SpaceDTO } from "@/features/space/types";
import { privateProcedure, router } from "../trpc";

export const spaces = router({
  list: privateProcedure.query(async ({ ctx }) => {
    const { user } = ctx;

    if (!user) {
      return [];
    }

    const result = await prisma.spaceMember.findMany({
      where: {
        userId: user.id,
      },
      select: {
        role: true,
        space: {
          select: {
            id: true,
            name: true,
            image: true,
            ownerId: true,
            tier: true,
          },
        },
      },
    });

    return result.map<SpaceDTO>((spaceMember) =>
      createSpaceDTO({
        ...spaceMember.space,
        role: spaceMember.role,
      }),
    );
  }),
});
