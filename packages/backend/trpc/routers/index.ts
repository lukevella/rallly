import { mergeRouters, router } from "../trpc";
import { auth } from "./auth";
import { polls } from "./polls";
import { responses } from "./responses";
import { user } from "./user";

export const appRouter = mergeRouters(
  router({
    auth,
    polls,
    user,
    responses,
  }),
);

export type AppRouter = typeof appRouter;
