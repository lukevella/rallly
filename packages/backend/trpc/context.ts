import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { IronSession } from "iron-session";
import { GetServerSidePropsContext } from "next";
import superjson from "superjson";

import { randomid } from "../utils/nanoid";
import { appRouter } from "./routers";

export async function createUser(session: IronSession) {
  session.user = {
    id: `user-${randomid()}`,
    isGuest: true,
  };
  await session.save();

  return session.user;
}

export async function createContext(
  opts: trpcNext.CreateNextContextOptions | GetServerSidePropsContext,
) {
  let user = opts.req.session.user;
  if (!user) {
    user = await createUser(opts.req.session);
  }
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
