import { EmailClient, SupportedEmailProviders } from "@rallly/emails";
import { createProxySSGHelpers } from "@trpc/react-query/ssg";
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { GetServerSidePropsContext } from "next";
import superjson from "superjson";

import { randomid } from "../utils/nanoid";
import { appRouter } from "./routers";

// Avoid use NODE_ENV directly because it will be replaced when using the dev server for e2e tests
const env = process.env["NODE" + "_ENV"];

export async function createContext(
  opts: trpcNext.CreateNextContextOptions | GetServerSidePropsContext,
) {
  let user = opts.req.session.user;
  if (!user) {
    user = {
      id: `user-${randomid()}`,
      isGuest: true,
    };
    opts.req.session.user = user;
    await opts.req.session.save();
  }

  const emailClient = new EmailClient({
    openPreviews: env === "development",
    useTestServer: env === "test",
    provider: {
      name: (process.env.EMAIL_PROVIDER as SupportedEmailProviders) ?? "smtp",
    },
    mail: {
      from: {
        name: "Rallly",
        address:
          (process.env.NOREPLY_EMAIL as string) ||
          (process.env.SUPPORT_EMAIL as string),
      },
    },
  });

  return {
    user,
    session: opts.req.session,
    req: opts.req,
    res: opts.res,
    isSelfHosted: process.env.NEXT_PUBLIC_SELF_HOSTED === "true",
    emailClient,
  };
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
