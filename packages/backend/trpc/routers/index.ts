import { mergeRouters, router } from "../trpc";
import { auth } from "./auth";
import { polls } from "./polls";
import { scheduledEvents } from "./scheduled-events";
import { user } from "./user";

export const appRouter = mergeRouters(
  router({
    scheduledEvents,
    auth,
    polls,
    user,
  }),
);

export type AppRouter = typeof appRouter;
