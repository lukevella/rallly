import { prisma } from "@rallly/database";
import {
  IronSession,
  IronSessionOptions,
  sealData,
  unsealData,
} from "iron-session";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import {
  GetServerSideProps,
  GetServerSidePropsContext,
  NextApiHandler,
} from "next";

import { createSSGHelperFromContext } from "../server/context";
import { randomid } from "./nanoid";

const sessionOptions: IronSessionOptions = {
  password: process.env.SECRET_PASSWORD,
  cookieName: "rallly-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
  ttl: 0, // basically forever
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

export type EnableNotificationsTokenPayload = {
  adminUrlId: string;
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

export type UserSession = GuestUserSession | RegisteredUserSession;

const setUser = async (session: IronSession) => {
  if (!session.user) {
    session.user = await createGuestUser();
    await session.save();
  }

  if (!session.user.isGuest) {
    // Check registered user still exists
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      session.user = await createGuestUser();
      await session.save();
    }
  }
};

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(async (req, res) => {
    await setUser(req.session);
    return await handler(req, res);
  }, sessionOptions);
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
    return await withAuth(ctx);
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

export const createGuestUser = async (): Promise<{
  isGuest: true;
  id: string;
}> => {
  return {
    id: `user-${await randomid()}`,
    isGuest: true,
  };
};

// assigns participants and comments created by guests to a user
// we could have multiple guests because a login might be triggered from one device
// and opened in another one.
export const mergeGuestsIntoUser = async (
  userId: string,
  guestIds: string[],
) => {
  await prisma.participant.updateMany({
    where: {
      userId: {
        in: guestIds,
      },
    },
    data: {
      userId: userId,
    },
  });

  await prisma.comment.updateMany({
    where: {
      userId: {
        in: guestIds,
      },
    },
    data: {
      userId: userId,
    },
  });
};

export const getCurrentUser = async (
  session: IronSession,
): Promise<{ isGuest: boolean; id: string }> => {
  await setUser(session);

  return session.user;
};
