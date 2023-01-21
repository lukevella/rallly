import { prisma } from "~/prisma/db";

import { createGuestUser, UserSession } from "../../utils/auth";
import { createRouter } from "../createRouter";
import { mergeRouters, publicProcedure, router } from "../trpc";
import { login } from "./login";
import { polls } from "./polls";
import { user } from "./user";

const legacyRouter = createRouter()
  .merge("user.", user)
  .merge(login)
  .merge("polls.", polls);

const whoami = router({
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

export const appRouter = mergeRouters(
  legacyRouter.interop(),
  router({ whoami }),
);

export type AppRouter = typeof appRouter;
