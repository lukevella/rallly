import { PrismaAdapter } from "@auth/prisma-adapter";
import { generateOtp, randomid } from "@rallly/backend/utils/nanoid";
import { prisma } from "@rallly/database";
import cookie from "cookie";
import { IronSession, unsealData } from "iron-session";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { NextAuthOptions, RequestInternal } from "next-auth";
import NextAuth, {
  getServerSession as getServerSessionWithOptions,
} from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";

import { emailClient } from "@/utils/emails";

const authOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.SECRET_PASSWORD,
  session: {
    strategy: "jwt",
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure:
          process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://") ?? false,
      },
    },
  },
  providers: [
    CredentialsProvider({
      id: "guest",
      name: "Guest",
      credentials: {},
      async authorize() {
        return {
          id: `user-${randomid()}`,
          email: null,
          name: "Guest",
          isGuest: true,
        };
      },
    }),
    EmailProvider({
      server: "",
      from: process.env.NOREPLY_EMAIL,
      generateVerificationToken() {
        return generateOtp();
      },
      async sendVerificationRequest({ identifier: email, token, url }) {
        await emailClient.sendTemplate("LoginEmail", {
          to: email,
          subject: `${token} is your 6-digit code`,
          props: {
            name: "User",
            magicLink: url,
            code: token,
          },
        });
      },
    }),
  ],
  pages: {
    signIn: "/login",
    signOut: "/logout",
    verifyRequest: "/verify",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
    async signIn({ user }) {
      if (user.email) {
        const userExists =
          (await prisma.user.count({
            where: {
              email: user.email,
            },
          })) > 0;
        if (userExists) {
          if (isEmailBlocked(user.email)) {
            return false;
          }
          return true;
        } else {
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isGuest = token.email === null;
      return session;
    },
  },
} satisfies NextAuthOptions;

export function getServerSession(
  ...args:
    | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
    | [NextApiRequest, NextApiResponse]
    | []
) {
  return getServerSessionWithOptions(...args, authOptions);
}

export async function AuthApiRoute(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, authOptions);
}

export const isEmailBlocked = (email: string) => {
  if (process.env.ALLOWED_EMAILS) {
    const allowedEmails = process.env.ALLOWED_EMAILS.split(",");
    // Check whether the email matches enough of the patterns specified in ALLOWED_EMAILS
    const isAllowed = allowedEmails.some((allowedEmail) => {
      const regex = new RegExp(
        `^${allowedEmail
          .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
          .replaceAll(/[*]/g, ".*")}$`,
      );
      return regex.test(email);
    });

    if (!isAllowed) {
      return true;
    }
  }
  return false;
};

export const legacySessionConfig = {
  password: process.env.SECRET_PASSWORD ?? "",
  cookieName: "rallly-session",
  cookieOptions: {
    secure: process.env.NEXT_PUBLIC_BASE_URL?.startsWith("https://") ?? false,
  },
  ttl: 60 * 60 * 24 * 30, // 30 days
};

export const getUserFromLegacySession = async (
  req: Pick<RequestInternal, "headers">,
) => {
  const parsedCookie = cookie.parse(req.headers?.cookie);
  if (parsedCookie[legacySessionConfig.cookieName]) {
    try {
      const session = await unsealData<IronSession>(
        parsedCookie[legacySessionConfig.cookieName],
        {
          password: process.env.SECRET_PASSWORD,
        },
      );
      if (session.user) {
        return session.user;
      }
    } catch (e) {
      return null;
    }
  }
  return null;
};
