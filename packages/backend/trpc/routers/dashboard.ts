import { prisma } from "@rallly/database";

import { possiblyPublicProcedure, router } from "../trpc";

export const dashboard = router({
  info: possiblyPublicProcedure.query(async ({ ctx }) => {
    const activePollCount = await prisma.poll.count({
      where: {
        userId: ctx.user.id,
        status: "live",
      },
    });

    return { activePollCount };
  }),
});
