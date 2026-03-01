import "@/lib/dayjs";

import { mergeRouters, router } from "../trpc";
import { admin } from "./admin";
import { apiKeys } from "./api-keys";
import { auth } from "./auth";
import { billing } from "./billing";
import { calendars } from "./calendars";
import { dashboard } from "./dashboard";
import { events } from "./events";
import { licensing } from "./licensing";
import { polls } from "./polls";
import { spaces } from "./spaces";
import { user } from "./user";

export const appRouter = mergeRouters(
  router({
    admin,
    apiKeys,
    auth,
    billing,
    dashboard,
    events,
    licensing,
    polls,
    spaces,
    user,
    calendars,
  }),
);

export type AppRouter = typeof appRouter;
