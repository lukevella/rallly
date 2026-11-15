import { mergeRouters, router } from "../trpc";
import { auth } from "./auth";
import { billing } from "./billing";
import { calendars } from "./calendars";
import { eventTypes } from "./event-types";
import { events } from "./events";
import { polls } from "./polls";
import { search } from "./search";
import { spaces } from "./spaces";

export const appRouter = mergeRouters(
  router({
    auth,
    billing,
    eventTypes,
    events,
    polls,
    search,
    spaces,
    calendars,
  }),
);

export type AppRouter = typeof appRouter;
