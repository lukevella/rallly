import { mergeRouters, router } from "../trpc";
import { auth } from "./auth";
import { feedback } from "./feedback";
import { polls } from "./polls";
import { user } from "./user";
import { userPreferences } from "./user-preferences";
import { whoami } from "./whoami";

export const appRouter = mergeRouters(
  router({
    whoami,
    auth,
    polls,
    user,
    feedback,
    userPreferences,
  }),
);

export type AppRouter = typeof appRouter;
