import { mergeRouters, router } from "../trpc";
import { auth } from "./auth";
import { events } from "./events";
import { polls } from "./polls";
import { user } from "./user";

export const appRouter = mergeRouters(
  router({
    events,
    auth,
    polls,
    user,
  }),
);

export type AppRouter = typeof appRouter;
