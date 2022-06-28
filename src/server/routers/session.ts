import { createRouter } from "../createRouter";

export const session = createRouter()
  .query("get", {
    async resolve({ ctx }) {
      return ctx.session.user;
    },
  })
  .mutation("destroy", {
    async resolve({ ctx }) {
      ctx.session.destroy();
    },
  });
