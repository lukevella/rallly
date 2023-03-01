import { mergeRouters, router } from "../trpc";
import { auth } from "./auth";
import { login } from "./login";
import { polls } from "./polls";
import { user } from "./user";
import { whoami } from "./whoami";

export const appRouter = mergeRouters(
  router({
    whoami,
    auth,
    polls,
    user,
    login,
  }),
);

export type AppRouter = typeof appRouter;
