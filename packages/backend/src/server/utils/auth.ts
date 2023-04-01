import { IronSessionOptions, sealData, unsealData } from "iron-session";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextApiHandler,
} from "next";

import { createSSGHelperFromContext } from "../server/context";

export const sessionOptions: IronSessionOptions = {
  password: process.env.SECRET_PASSWORD ?? "",
  cookieName: "rallly-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
  ttl: 60 * 24 * 30, // 30 days
};

export type RegistrationTokenPayload = {
  name: string;
  email: string;
  code: string;
};

export type LoginTokenPayload = {
  userId: string;
  code: string;
};

export type RegisteredUserSession = {
  isGuest: false;
  id: string;
  name: string;
  email: string;
};

export type GuestUserSession = {
  isGuest: true;
  id: string;
};

export type DisableNotificationsPayload = {
  pollId: string;
  watcherId: number;
};

export type UserSession = GuestUserSession | RegisteredUserSession;

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(handler, sessionOptions);
}

export const composeGetServerSideProps = (
  ...fns: GetServerSideProps[]
): GetServerSideProps => {
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
  }, sessionOptions);
}

export const decryptToken = async <P extends Record<string, unknown>>(
  token: string,
): Promise<P | null> => {
  const payload = await unsealData(token, {
    password: sessionOptions.password,
  });
  if (Object.keys(payload).length === 0) {
    return null;
  }

  return payload as P;
};

export const createToken = async <T extends Record<string, unknown>>(
  payload: T,
  options?: {
    ttl?: number;
  },
) => {
  return await sealData(payload, {
    password: sessionOptions.password,
    ttl: options?.ttl ?? 60 * 15, // 15 minutes
  });
};
