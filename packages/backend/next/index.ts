import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextApiHandler,
} from "next";

import { sessionOptions } from "@/session";
import { createSSGHelperFromContext } from "@/trpc/context";

export function composeGetServerSideProps(
  ...fns: GetServerSideProps[]
): GetServerSideProps {
  return async (ctx) => {
    const res = { props: {} };
    for (const getServerSideProps of fns) {
      const fnRes = await getServerSideProps(ctx);

      if ("props" in fnRes) {
        res.props = {
          ...res.props,
          ...fnRes.props,
        };
      } else {
        return fnRes;
      }
    }

    return res;
  };
}

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

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
  }, sessionOptions);
}
