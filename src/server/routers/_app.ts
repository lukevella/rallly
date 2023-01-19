import { z } from "zod";

import { prisma } from "~/prisma/db";

import { createRouter } from "../createRouter";
import { mergeRouters, publicProcedure, router } from "../trpc";
import { login } from "./login";
import { polls } from "./polls";
import { session } from "./session";
import { user } from "./user";

const legacyRouter = createRouter()
  .merge("user.", user)
  .merge(login)
  .merge("polls.", polls)
  .merge("session.", session);

export const appRouter = mergeRouters(
  legacyRouter.interop(),
  router({
    p: router({
      touch: publicProcedure
        .input(
          z.object({
            pollId: z.string(),
          }),
        )
        .mutation(async ({ input }) => {
          await prisma.poll.update({
            where: {
              id: input.pollId,
            },
            data: {
              touchedAt: new Date(),
            },
          });
        }),
    }),
  }),
);

export type AppRouter = typeof appRouter;
