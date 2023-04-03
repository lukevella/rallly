import { prisma } from "@rallly/database";

import { publicProcedure, router } from "../trpc";
import { UserSession } from "../types";

export const whoami = router({
  get: publicProcedure.query(async ({ ctx }): Promise<UserSession> => {
    if (ctx.user.isGuest) {
      return { isGuest: true, id: ctx.user.id };
    }

    const user = await prisma.user.findUnique({
      select: { id: true, name: true, email: true },
      where: { id: ctx.user.id },
    });

    if (user === null) {
      ctx.session.destroy();
      throw new Error("User not found");
    }

    return { isGuest: false, ...user };
  }),
  destroy: publicProcedure.mutation(async ({ ctx }) => {
    ctx.session.destroy();
  }),
});
