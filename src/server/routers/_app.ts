import { createRouter } from "../createRouter";
import { mergeRouters, router } from "../trpc";
import { auth } from "./auth";
import { login } from "./login";
import { legacyPolls, poll } from "./polls";
import { user } from "./user";
import { whoami } from "./whoami";

const legacyRouter = createRouter()

export const appRouter = mergeRouters(
  legacyRouter.interop(),
  router({
    whoami,
    auth,
    poll,
    polls: legacyPolls,
    login,
    user,
  }),
);

export type AppRouter = typeof appRouter;
