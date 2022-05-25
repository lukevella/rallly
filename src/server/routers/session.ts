import { prisma } from "~/prisma/db";

import { createRouter } from "../createRouter";

export const session = createRouter()
  .query("get", {
    async resolve({ ctx }) {
      if (ctx.session.user?.isGuest === false) {
        const user = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
        });

        if (!user) {
          ctx.session.destroy();
          return null;
        }

        ctx.session.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          isGuest: false,
        };

        await ctx.session.save();
      }

      return ctx.session.user;
    },
  })
  .mutation("destroy", {
    async resolve({ ctx }) {
      ctx.session.destroy();
    },
  });
