import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import z from "zod";

import { CustomPrismaAdapter } from "./auth/adapters/prisma";
import { isEmailBlocked } from "./auth/helpers/is-email-blocked";
import { mergeGuestsIntoUser } from "./auth/helpers/merge-user";
import { getLegacySession } from "./auth/legacy/next-auth-cookie-migration";
import { EmailProvider } from "./auth/providers/email";
import { GoogleProvider } from "./auth/providers/google";
import { GuestProvider } from "./auth/providers/guest";
import { MicrosoftProvider } from "./auth/providers/microsoft";
import { OIDCProvider } from "./auth/providers/oidc";
import { RegistrationTokenProvider } from "./auth/providers/registration-token";
import { nextAuthConfig } from "./next-auth.config";

const sessionUpdateSchema = z.object({
  locale: z.string().nullish(),
  timeFormat: z.enum(["12h", "24h"]).nullish(),
  timeZone: z.string().nullish(),
  weekStart: z.number().nullish(),
});

const {
  auth: originalAuth,
  handlers,
  signIn,
  signOut,
} = NextAuth({
  ...nextAuthConfig,
  adapter: CustomPrismaAdapter({
    migrateData: async (userId) => {
      const session = await auth();
      if (session?.user && session.user.email === null) {
        await mergeGuestsIntoUser(userId, [session.user.id]);
      }
    },
  }),
  providers: [
    RegistrationTokenProvider,
    EmailProvider,
    GuestProvider,
    ...([GoogleProvider(), OIDCProvider(), MicrosoftProvider()].filter(
      Boolean,
    ) as Provider[]),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  events: {
    signIn({ user, account }) {
      if (user.id) {
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
      }
    },
  },
  callbacks: {
    ...nextAuthConfig.callbacks,
    async signIn({ user, email, profile }) {
      const distinctId = user.id;
      // prevent sign in if email is not verified
      if (
        profile &&
        "email_verified" in profile &&
        profile.email_verified === false &&
        distinctId
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
        const session = await auth();
        if (user.id && session?.user && !session.user.email) {
          await mergeGuestsIntoUser(user.id, [session.user.id]);
        }
      }

      return true;
    },
    async jwt({ token, session, trigger }) {
      if (trigger === "update") {
        const parsed = sessionUpdateSchema.safeParse(session);
        if (parsed.success) {
          Object.entries(parsed.data).forEach(([key, value]) => {
            token[key] = value;
          });
        } else {
          console.error(parsed.error);
        }
      } else {
        const userId = token.sub;
        const isGuest = userId?.startsWith("guest-");

        if (userId && !isGuest) {
          const user = await prisma.user.findUnique({
            where: {
              id: userId,
            },
            select: {
              name: true,
              email: true,
              locale: true,
              timeFormat: true,
              timeZone: true,
              weekStart: true,
            },
          });

          if (user) {
            token.name = user.name;
            token.email = user.email;
            token.locale = user.locale;
            token.timeFormat = user.timeFormat;
            token.timeZone = user.timeZone;
            token.weekStart = user.weekStart;
          }
        }
      }

      return token;
    },
  },
});

const auth = async () => {
  const session = await originalAuth();
  if (session) {
    return session;
  }

  return getLegacySession();
};

export { auth, handlers, signIn, signOut };
