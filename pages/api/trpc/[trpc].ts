import * as trpcNext from "@trpc/server/adapters/next";

import { createContext } from "../../../server/context";
import { createRouter } from "../../../server/createRouter";
import { polls } from "../../../server/routers/polls";
import { session } from "../../../server/routers/session";
import { withSessionRoute } from "../../../utils/auth";

export const appRouter = createRouter()
  .merge("session.", session)
  .merge("polls.", polls);

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default withSessionRoute(
  trpcNext.createNextApiHandler({
    router: appRouter,
    createContext,
  }),
);
