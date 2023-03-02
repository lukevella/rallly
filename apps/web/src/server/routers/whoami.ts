import { prisma } from "@rallly/database";

import { createGuestUser, UserSession } from "../../utils/auth";
import { publicProcedure, router } from "../trpc";

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
      const guestUser = await createGuestUser();
      ctx.session.user = guestUser;
      await ctx.session.save();

      return guestUser;
    }

    return { isGuest: false, ...user };
  }),
  destroy: publicProcedure.mutation(async ({ ctx }) => {
    ctx.session.destroy();
  }),
});
