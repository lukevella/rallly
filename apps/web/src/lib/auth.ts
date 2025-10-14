import { prisma } from "@rallly/database";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { headers } from "next/headers";
import { mergeGuestsIntoUser } from "@/auth/helpers/merge-user";
import { env } from "@/env";
import { getLocale } from "@/i18n/server/get-locale";
import { isKvEnabled, kv } from "@/lib/kv";
import { auth } from "@/next-auth";
import { getEmailClient } from "@/utils/emails";

export const authLib = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    emailOTP({
      disableSignUp: true,
      async sendVerificationOTP({ email, otp, type }) {
        const locale = await getLocale();
        switch (type) {
          case "sign-in":
            await getEmailClient(locale).sendTemplate("LoginEmail", {
              to: email,
              props: {
                magicLink: absoluteUrl("/auth/login", {
                  code: otp,
                  email,
                }),
                code: otp,
              },
            });
            break;
          case "email-verification":
            await getEmailClient(locale).sendTemplate("RegisterEmail", {
              to: email,
              props: { code: otp },
            });
            break;
        }
      },
    }),
  ],
  socialProviders: {
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          }
        : undefined,
    microsoft:
      env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET
        ? {
            tenantId: env.MICROSOFT_TENANT_ID,
            clientId: env.MICROSOFT_CLIENT_ID,
            clientSecret: env.MICROSOFT_CLIENT_SECRET,
          }
        : undefined,
  },
  user: {
    additionalFields: {
      timeZone: {
        type: "string",
        input: true,
      },
    },
  },
  secondaryStorage: isKvEnabled
    ? {
        set: async (key: string, value: string, ttl?: number) => {
          if (ttl) {
            await kv.set(key, value, {
              ex: ttl,
            });
          } else {
            await kv.set(key, value);
          }
        },
        get: async (key: string) => {
          return await kv.get(key);
        },
        delete: async (key: string) => {
          await kv.del(key);
        },
      }
    : undefined,
  rateLimit: {
    storage: isKvEnabled ? "secondary-storage" : "memory",
  },
  account: {
    fields: {
      providerId: "provider",
      accountId: "providerAccountId",
      refreshToken: "refresh_token",
      accessToken: "access_token",
      idToken: "id_token",
    },
  },
  databaseHooks: {
    session: {
      create: {
        after: async (session) => {
          // Merge legacy guest users into new user
          const legacySession = await auth();

          if (legacySession?.user?.isGuest) {
            await mergeGuestsIntoUser(session.userId, [legacySession.user.id]);
          }
        },
      },
    },
  },
});

export type Auth = typeof authLib;
