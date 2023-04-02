import * as trpcNext from "@trpc/server/adapters/next";

import { createContext } from "../../trpc/context";
import { appRouter } from "../../trpc/routers";
import { withSessionRoute } from "../session";

export const trpcNextApiHandler = withSessionRoute(
  trpcNext.createNextApiHandler({
    router: appRouter,
    createContext,
  }),
);
