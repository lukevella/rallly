import "@/lib/dayjs";

import { mergeRouters, router } from "../trpc";
import { apiKeys } from "./api-keys";
import { auth } from "./auth";
import { calendars } from "./calendars";
import { dashboard } from "./dashboard";
import { events } from "./events";
import { polls } from "./polls";
import { user } from "./user";

export const appRouter = mergeRouters(
  router({
    apiKeys,
    auth,
    dashboard,
    events,
    polls,
    user,
    calendars,
  }),
);

export type AppRouter = typeof appRouter;
