import * as trpcNext from "@trpc/server/adapters/next";
import superjson from "superjson";

import { createContext } from "../../../server/context";
import { createRouter } from "../../../server/createRouter";
import { login } from "../../../server/routers/login";
import { polls } from "../../../server/routers/polls";
import { session } from "../../../server/routers/session";
import { user } from "../../../server/routers/user";
import { withSessionRoute } from "../../../utils/auth";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("session.", session)
  .merge("polls.", polls)
  .merge(login)
  .merge("user.", user);

// export type definition of API
export type AppRouter = typeof appRouter;

export const config = {
  api: {
    externalResolver: true,
  },
};
// export API handler
export default withSessionRoute(
  trpcNext.createNextApiHandler({
    router: appRouter,
    createContext,
  }),
);
