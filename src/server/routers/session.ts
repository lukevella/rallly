import { prisma } from "~/prisma/db";

import { createRouter } from "../createRouter";

export const session = createRouter()
  .query("get", {
    async resolve({ ctx }) {
      if (ctx.session.user?.isGuest === false) {
        const user = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
        });

        return user
          ? { id: user.id, name: user.name, email: user.email, isGuest: false }
          : null;
      }
      return ctx.session.user;
    },
  })
  .mutation("destroy", {
    async resolve({ ctx }) {
      ctx.session.destroy();
    },
  });
