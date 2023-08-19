import type { IncomingMessage, ServerResponse } from "http";
import { getIronSession } from "iron-session";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextApiHandler,
} from "next";

import { sessionConfig } from "../session-config";
import { createSSGHelperFromContext } from "../trpc/context";
import { composeGetServerSideProps } from "./utils";

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionConfig);
}

export const getSession = async (
  req: Request | IncomingMessage,
  res: Response | ServerResponse,
) => {
  return getIronSession(req, res, sessionConfig);
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
