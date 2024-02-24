import { mergeRouters, router } from "../trpc";
import { auth } from "./auth";
import { polls } from "./polls";
import { user } from "./user";

export const appRouter = mergeRouters(
  router({
    auth,
    polls,
    user,
  }),
);

export type AppRouter = typeof appRouter;
