import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { GetServerSidePropsContext } from "next";
import superjson from "superjson";

import { getCurrentUser } from "../utils/auth";
import { appRouter } from "./routers/_app";

export async function createContext(
  opts: trpcNext.CreateNextContextOptions | GetServerSidePropsContext,
) {
  const user = await getCurrentUser(opts.req.session);

  return { user, session: opts.req.session };
}

export type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const createSSGHelperFromContext = async (
  ctx: GetServerSidePropsContext,
) =>
  createProxySSGHelpers({
    router: appRouter,
    ctx: await createContext(ctx),
    transformer: superjson,
  });
