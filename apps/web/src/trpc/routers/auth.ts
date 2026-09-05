import { prisma } from "@rallly/database";
import * as z from "zod";

import { createRateLimitMiddleware, publicProcedure, router } from "../trpc";

export const auth = router({
  getLoginMethod: publicProcedure
    .input(z.object({ email: z.email() }))
    .use(createRateLimitMiddleware("get_login_method", 10, "1 m"))
    .mutation(async ({ input }) => {
      /**
       * This should probably be a query instead of a mutation, but we need to
       * keep it as a mutation for now to avoid breaking changes.
       */
      const user = await prisma.user.findUnique({
        where: { email: input.email },
        select: {
          emailVerified: true,
          accounts: {
            select: {
              provider: true,
            },
          },
        },
      });

      if (
        user?.emailVerified &&
        user?.accounts.some((account) => account.provider === "credential")
      ) {
        return { method: "credential" as const };
      }

      return { method: "email" as const };
    }),
});
