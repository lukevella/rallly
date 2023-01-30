import { createRouter } from "../createRouter";
import { mergeRouters, router } from "../trpc";
import { auth } from "./auth";
import { login } from "./login";
import { polls } from "./polls";
import { user } from "./user";
import { whoami } from "./whoami";

const legacyRouter = createRouter()
  .merge("user.", user)
  .merge(login)
  .merge("polls.", polls);

export const appRouter = mergeRouters(
  legacyRouter.interop(),
  router({
    whoami,
    auth,
  }),
);

export type AppRouter = typeof appRouter;
