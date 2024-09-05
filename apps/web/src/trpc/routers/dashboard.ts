import { prisma } from "@rallly/database";

import { possiblyPublicProcedure, router } from "../trpc";

export const dashboard = router({
  info: possiblyPublicProcedure.query(async ({ ctx }) => {
    const activePollCount = await prisma.poll.count({
      where: {
        userId: ctx.user.id,
        status: "live",
        deleted: false, // TODO (Luke Vella) [2024-06-16]: We should add deleted/cancelled to the status enum
      },
    });

    return { activePollCount };
  }),
});
