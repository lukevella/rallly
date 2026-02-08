import "@/lib/dayjs";

import { mergeRouters, router } from "../trpc";
import { apiKeys } from "./api-keys";
import { auth } from "./auth";
import { calendars } from "./calendars";
import { events } from "./events";
import { polls } from "./polls";
import { user } from "./user";

export const appRouter = mergeRouters(
  router({
    apiKeys,
    auth,
    events,
    polls,
    user,
    calendars,
  }),
);

export type AppRouter = typeof appRouter;
