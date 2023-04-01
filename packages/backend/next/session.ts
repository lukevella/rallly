import * as trpcNext from "@trpc/server/adapters/next";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import { GetServerSideProps, GetServerSidePropsContext } from "next";

import { sessionConfig } from "../session";
import { createContext, createSSGHelperFromContext } from "../trpc/context";
import { appRouter } from "../trpc/routers";
import { composeGetServerSideProps } from "./utils";

export const withSessionRoute = withIronSessionApiRoute(
  trpcNext.createNextApiHandler({
    router: appRouter,
    createContext,
  }),
  sessionConfig,
);

/**
 * Require user to be logged in
 * @returns
 */
export const withAuth: GetServerSideProps = async (ctx) => {
  if (!ctx.req.session.user || ctx.req.session.user.isGuest) {
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };
  }

  return { props: {} };
};

/**
 * Require user to be logged in if AUTH_REQUIRED is true
 * @returns
 */
export const withAuthIfRequired: GetServerSideProps = async (ctx) => {
  if (process.env.AUTH_REQUIRED === "true") {
    if (!ctx.req.session.user || ctx.req.session.user.isGuest) {
      return {
        redirect: {
          destination: "/login",
          permanent: false,
        },
      };
    }
  }
  return { props: {} };
};

export function withSessionSsr(
  handler: GetServerSideProps | GetServerSideProps[],
  options?: {
    onPrefetch?: (
      ssg: Awaited<ReturnType<typeof createSSGHelperFromContext>>,
      ctx: GetServerSidePropsContext,
    ) => Promise<void>;
  },
): GetServerSideProps {
  const composedHandler = Array.isArray(handler)
    ? composeGetServerSideProps(...handler)
    : handler;

  return withIronSessionSsr(async (ctx) => {
    const ssg = await createSSGHelperFromContext(ctx);
    await ssg.whoami.get.prefetch(); // always prefetch user
    if (options?.onPrefetch) {
      try {
        await options.onPrefetch(ssg, ctx);
      } catch {
        return {
          notFound: true,
        };
      }
    }
    const res = await composedHandler(ctx);
    if ("props" in res) {
      return {
        ...res,
        props: {
          ...res.props,
          trpcState: ssg.dehydrate(),
        },
      };
    }

    return res;
  }, sessionConfig);
}
