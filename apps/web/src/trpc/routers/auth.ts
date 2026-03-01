import { prisma } from "@rallly/database";
import * as z from "zod";

import { decryptToken } from "@/utils/session";
import { createRateLimitMiddleware, publicProcedure, router } from "../trpc";

export const auth = router({
  getUserPermission: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const res = await decryptToken<{ userId: string }>(input.token);

      if (!res) {
        return null;
      }

      return res;
    }),

  getLoginMethod: publicProcedure
    .input(z.object({ email: z.email() }))
    .use(createRateLimitMiddleware("get_login_method", 10, "1 m"))
    .query(async ({ input }) => {
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
