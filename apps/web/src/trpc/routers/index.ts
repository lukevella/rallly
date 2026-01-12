import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import toArray from "dayjs/plugin/toArray";
import utc from "dayjs/plugin/utc";

import { mergeRouters, router } from "../trpc";
import { apiKeys } from "./api-keys";
import { auth } from "./auth";
import { calendars } from "./calendars";
import { events } from "./events";
import { polls } from "./polls";
import { user } from "./user";

dayjs.extend(toArray); // used for creating ics
dayjs.extend(timezone);
dayjs.extend(utc);

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
