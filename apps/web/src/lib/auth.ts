import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { BetterAuthPlugin } from "better-auth";
import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  admin,
  createAuthMiddleware,
  emailOTP,
  genericOAuth,
  lastLoginMethod,
} from "better-auth/plugins";
import { isEmailBlocked } from "@/auth/helpers/is-email-blocked";
import { mergeGuestsIntoUser } from "@/auth/helpers/merge-user";
import { env } from "@/env";
import { getLocale } from "@/i18n/server/get-locale";
import { isKvEnabled, kv } from "@/lib/kv";
import { legacyAuth } from "@/next-auth";
import { getEmailClient } from "@/utils/emails";
import { getValueByPath } from "@/utils/get-value-by-path";

const baseURL = absoluteUrl("/api/better-auth");

const plugins: BetterAuthPlugin[] = [
  lastLoginMethod({
    storeInDatabase: true,
  }),
  admin(),
  emailOTP({
    disableSignUp: true,
    expiresIn: 15 * 60,
    overrideDefaultEmailVerification: true,
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
];

if (env.OIDC_CLIENT_ID && env.OIDC_CLIENT_SECRET && env.OIDC_DISCOVERY_URL) {
  if (env.OIDC_ISSUER_URL) {
    console.info(
      "OIDC_ISSUER_URL is no longer used. You can remove it from your environment variables.",
    );
  }
  plugins.push(
    genericOAuth({
      config: [
        {
          providerId: "oidc",
          discoveryUrl: env.OIDC_DISCOVERY_URL,
          clientId: env.OIDC_CLIENT_ID,
          clientSecret: env.OIDC_CLIENT_SECRET,
          scopes: ["openid", "profile", "email"],
          mapProfileToUser(profile) {
            return {
              name: getValueByPath(profile, env.OIDC_NAME_CLAIM_PATH) as string,
              email: getValueByPath(
                profile,
                env.OIDC_EMAIL_CLAIM_PATH,
              ) as string,
              image: getValueByPath(
                profile,
                env.OIDC_PICTURE_CLAIM_PATH,
              ) as string,
            };
          },
        },
      ],
    }),
  );
}

export const authLib = betterAuth({
  appName: "Rallly",
  secret: env.SECRET_PASSWORD,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: true,
  }),
  plugins,
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
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (
        ctx.path.includes("/sign-in") ||
        ctx.path.includes("/send-verification-otp")
      ) {
        if (ctx.body?.email) {
          if (isEmailBlocked(ctx.body.email as string)) {
            throw new APIError("BAD_REQUEST", {
              code: "EMAIL_BLOCKED",
              message:
                "This email address is not allowed. Please use a different email or contact support.",
            });
          }
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          posthog?.capture({
            distinctId: user.id,
            event: "register",
            properties: {
              method: "sso",
              $set: {
                name: user.name,
                email: user.email,
                tier: "hobby",
                timeZone: user.timeZone ?? undefined,
                locale: user.locale ?? undefined,
              },
            },
          });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          // Merge legacy guest users into new user
          const legacySession = await legacyAuth();

          if (legacySession?.user?.isGuest) {
            await mergeGuestsIntoUser(session.userId, [legacySession.user.id]);
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  baseURL,
});

export type Auth = typeof authLib;
