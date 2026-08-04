import "@/lib/dayjs";

import { mergeRouters, router } from "../trpc";
import { auth } from "./auth";
import { billing } from "./billing";
import { calendars } from "./calendars";
import { dashboard } from "./dashboard";
import { eventTypes } from "./event-types";
import { events } from "./events";
import { polls } from "./polls";
import { spaces } from "./spaces";
import { system } from "./system";

export const appRouter = mergeRouters(
  router({
    auth,
    billing,
    dashboard,
    eventTypes,
    events,
    polls,
    spaces,
    system,
    calendars,
  }),
);

export type AppRouter = typeof appRouter;
