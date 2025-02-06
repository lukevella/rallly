import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import type { NextAuthOptions } from "next-auth";
import NextAuth, {
  getServerSession as getServerSessionWithOptions,
} from "next-auth/next";
import type { Provider } from "next-auth/providers/index";

import { CustomPrismaAdapter } from "./auth/custom-prisma-adapter";
import { mergeGuestsIntoUser } from "./auth/merge-user";
import { EmailProvider } from "./auth/providers/email";
import { GoogleProvider } from "./auth/providers/google";
import { GuestProvider } from "./auth/providers/guest";
import { MicrosoftProvider } from "./auth/providers/microsoft";
import { OIDCProvider } from "./auth/providers/oidc";
import { RegistrationTokenProvider } from "./auth/providers/registration-token";

function getOptionalProviders() {
  return [OIDCProvider(), GoogleProvider(), MicrosoftProvider()].filter(
    Boolean,
  ) as Provider[];
}

const getAuthOptions = (...args: GetServerSessionParams) =>
  ({
    adapter: CustomPrismaAdapter(prisma, {
      migrateData: async (userId) => {
        const session = await getServerSession(...args);
        if (session?.user && session.user.email === null) {
          await mergeGuestsIntoUser(userId, [session.user.id]);
        }
      },
    }),
    secret: process.env.SECRET_PASSWORD,
    session: {
      strategy: "jwt",
    },
    providers: [
      RegistrationTokenProvider,
      GuestProvider,
      EmailProvider,
      ...getOptionalProviders(),
    ],
    pages: {
      signIn: "/login",
      verifyRequest: "/login/verify",
      error: "/auth/error",
    },
    events: {
      signIn({ user, account }) {
        posthog?.capture({
          distinctId: user.id,
          event: "login",
          properties: {
            method: account?.provider,
            $set: {
              name: user.name,
              email: user.email,
              timeZone: user.timeZone,
              locale: user.locale,
            },
          },
        });
      },
    },
    callbacks: {
      async signIn({ user, email, profile }) {
        const distinctId = user.id;
        // prevent sign in if email is not verified
        if (
          profile &&
          "email_verified" in profile &&
          profile.email_verified === false
        ) {
          posthog?.capture({
            distinctId,
            event: "login failed",
            properties: {
              reason: "email not verified",
            },
          });
          return false;
        }
        // Make sure email is allowed
        if (user.email) {
          const isBlocked = isEmailBlocked(user.email);
          if (isBlocked) {
            return false;
          }
        }

        // For now, we don't allow users to login unless they have
        // registered an account. This is just because we need a name
        // to display on the dashboard. The flow can be modified so that
        // the name is requested after the user has logged in.
        if (email?.verificationRequest) {
          const isRegisteredUser =
            (await prisma.user.count({
              where: {
                email: user.email as string,
              },
            })) > 0;

          return isRegisteredUser;
        }

        // when we login with a social account for the first time, the user is not created yet
        // and the user id will be the same as the provider account id
        // we handle this case the the prisma adapter when we link accounts
        const isInitialSocialLogin = user.id === profile?.sub;

        if (!isInitialSocialLogin) {
          // merge guest user into newly logged in user
          const session = await getServerSession(...args);
          if (session?.user && !session.user.email) {
            await mergeGuestsIntoUser(user.id, [session.user.id]);
          }
        }

        return true;
      },
      async jwt({ token, session }) {
        if (session) {
          token.locale = session.locale;
          token.timeFormat = session.timeFormat;
          token.timeZone = session.timeZone;
          token.weekStart = session.weekStart;
        }

        return token;
      },
      async session({ session, token }) {
        if (!token.sub) {
          return session;
        }

        if (token.sub?.startsWith("user-")) {
          session.user = {
            id: token.sub as string,
            locale: token.locale,
            timeFormat: token.timeFormat,
            timeZone: token.timeZone,
            weekStart: token.weekStart,
          };
          return session;
        }

        const user = await prisma.user.findUnique({
          where: {
            id: token.sub as string,
          },
          select: {
            id: true,
            name: true,
            timeFormat: true,
            timeZone: true,
            locale: true,
            weekStart: true,
            email: true,
            image: true,
          },
        });

        if (user) {
          session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            locale: user.locale,
            timeFormat: user.timeFormat,
            timeZone: user.timeZone,
            weekStart: user.weekStart,
          };
        }

        return session;
      },
    },
  }) satisfies NextAuthOptions;

type GetServerSessionParams =
  | [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
  | [NextApiRequest, NextApiResponse]
  | [];

export async function getServerSession(...args: GetServerSessionParams) {
  return await getServerSessionWithOptions(...args, getAuthOptions(...args));
}

export async function AuthApiRoute(req: NextApiRequest, res: NextApiResponse) {
  const authOptions = getAuthOptions(req, res);
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

export function getOAuthProviders(): {
  id: string;
  name: string;
}[] {
  return getOptionalProviders()
    .filter((provider) => provider.type === "oauth")
    .map((provider) => {
      return {
        id: provider.id,
        name: provider.options?.name || provider.name,
      };
    });
}
