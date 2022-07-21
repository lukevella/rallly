import { IronSessionOptions, sealData, unsealData } from "iron-session";
import { withIronSessionApiRoute, withIronSessionSsr } from "iron-session/next";
import { GetServerSideProps, NextApiHandler } from "next";

import { prisma } from "~/prisma/db";

import { randomid } from "./nanoid";

const sessionOptions: IronSessionOptions = {
  password: process.env.SECRET_PASSWORD,
  cookieName: "rallly-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
  },
  ttl: 0, // basically forever
};

export function withSessionRoute(handler: NextApiHandler) {
  return withIronSessionApiRoute(async (req, res) => {
    if (!req.session.user) {
      req.session.user = await createGuestUser();
      await req.session.save();
    }
    return await handler(req, res);
  }, sessionOptions);
}

export function withSessionSsr(handler: GetServerSideProps) {
  return withIronSessionSsr(async (context) => {
    const { req } = context;
    if (!req.session.user) {
      req.session.user = await createGuestUser();
      await req.session.save();
    }
    const res = await handler(context);

    if ("props" in res) {
      return { ...res, props: { ...res.props, user: req.session.user } };
    }

    return res;
  }, sessionOptions);
}

export const decryptToken = async <P extends Record<string, unknown>>(
  token: string,
): Promise<P> => {
  return await unsealData(token, { password: sessionOptions.password });
};

export const createToken = async <T extends Record<string, unknown>>(
  payload: T,
) => {
  return await sealData(payload, {
    password: sessionOptions.password,
    ttl: 60 * 15, // 15 minutes
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
