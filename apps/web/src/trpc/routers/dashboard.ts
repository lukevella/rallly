import { prisma } from "@rallly/database";

import { privateProcedure, router } from "../trpc";

export const dashboard = router({
  info: privateProcedure.query(async ({ ctx }) => {
    const activePollCount = await prisma.poll.count({
      where: {
        ...(ctx.user.isGuest
          ? {
              guestId: ctx.user.id,
            }
          : {
              userId: ctx.user.id,
            }),
        status: "live",
        deleted: false, // TODO (Luke Vella) [2024-06-16]: We should add deleted/cancelled to the status enum
      },
    });

    return { activePollCount };
  }),
});
