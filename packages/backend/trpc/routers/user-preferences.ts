import { publicProcedure, router } from "../trpc";
import { prisma } from "@rallly/database";

export const userPreferences = router({
  get: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.user.isGuest) {
      return await prisma.userPreferences.findUnique({
        where: {
          userId: ctx.user.id,
        },
        select: {
          language: true,
          timeZone: true,
          weekStart: true,
          timeFormat: true,
        },
      });
    }
  }),
});
