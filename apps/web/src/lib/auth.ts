import { prisma } from "@rallly/database";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { BetterAuthPlugin } from "better-auth";
import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware } from "better-auth/api";
import {
  admin,
  anonymous,
  captcha,
  emailOTP,
  genericOAuth,
  lastLoginMethod,
} from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { cache } from "react";
import { isEmailBlocked } from "@/auth/helpers/is-email-blocked";
import { linkAnonymousUser } from "@/auth/helpers/merge-user";
import { isTemporaryEmail } from "@/auth/helpers/temp-email-domains";
import { env } from "@/env";
import { posthog } from "@/features/analytics/posthog";
import { createSpace } from "@/features/space/mutations";
import { getTranslation } from "@/i18n/server";
import { getLocale } from "@/i18n/server/get-locale";
import { redis } from "@/lib/kv";
import { getEmailClient } from "@/utils/emails";
import { getValueByPath } from "@/utils/get-value-by-path";

const kv = redis;

const baseURL = absoluteUrl("/api/better-auth");

const logger = createLogger("auth");

if (env.OIDC_ISSUER_URL) {
  logger.info(
    "OIDC_ISSUER_URL is no longer used. You can remove it from your environment variables.",
  );
}

// Conditional plugins are typed as BetterAuthPlugin[] — they don't add user
// fields so losing their specific types doesn't affect session type inference.
const conditionalPlugins: BetterAuthPlugin[] = [
  ...(env.TURNSTILE_SECRET_KEY
    ? [
        captcha({
          provider: "cloudflare-turnstile",
          secretKey: env.TURNSTILE_SECRET_KEY,
          endpoints: ["/sign-up/email"],
        }),
      ]
    : []),
  ...(env.OIDC_CLIENT_ID && env.OIDC_CLIENT_SECRET && env.OIDC_DISCOVERY_URL
    ? [
        genericOAuth({
          config: [
            {
              providerId: "oidc",
              discoveryUrl: env.OIDC_DISCOVERY_URL,
              clientId: env.OIDC_CLIENT_ID,
              clientSecret: env.OIDC_CLIENT_SECRET,
              scopes: ["openid", "profile", "email"],
              redirectURI: absoluteUrl("/api/auth/callback/oidc"),
              pkce: true,
              mapProfileToUser(profile) {
                return {
                  name: getValueByPath(
                    profile,
                    env.OIDC_NAME_CLAIM_PATH,
                  ) as string,
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
      ]
    : []),
];

export const authLib = betterAuth({
  appName: env.APP_NAME,
  secret: env.SECRET_PASSWORD,
  experimental: {
    joins: true,
  },
  emailAndPassword: {
    enabled: env.EMAIL_LOGIN_ENABLED !== "false",
    requireEmailVerification: true,
    onExistingUserSignUp: async ({ user }, request) => {
      await authLib.api.sendVerificationOTP({
        body: { email: user.email, type: "email-verification" },
        request,
      });
    },
    sendResetPassword: async ({ user, url }) => {
      const locale =
        "locale" in user ? (user.locale as string) : await getLocale();

      await (await getEmailClient({ locale })).sendTemplate(
        "ResetPasswordEmail",
        {
          to: user.email,
          props: {
            resetLink: url,
          },
        },
      );
    },
    onPasswordReset: async ({ user }) => {
      posthog()?.capture({
        distinctId: user.id,
        event: "password_reset",
      });
    },
  },
  emailVerification: {
    autoSignInAfterVerification: true,
  },
  database: prismaAdapter(prisma, {
    provider: "postgresql",
    transaction: false, // when set to true, there is an issue where the after() hook is called before the user is actually created in the database
  }),
  plugins: [
    admin(),
    anonymous({
      emailDomainName: "rallly.co",
      generateName: async () => {
        const { t } = await getTranslation();
        return t("guest");
      },
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        await linkAnonymousUser(newUser.user.id, anonymousUser.user.id);
      },
    }),
    lastLoginMethod({
      storeInDatabase: true,
    }),
    emailOTP({
      disableSignUp: true,
      expiresIn: 15 * 60,
      overrideDefaultEmailVerification: true,
      async sendVerificationOTP({ email, otp, type }) {
        const locale = await getLocale(); // TODO: Get locale from email
        const emailClient = await getEmailClient({ locale });
        switch (type) {
          // We're not actually using the sign-in type anymore since we just we have `autoSignInAfterVerification` enabled.
          // This lets us keep things a bit simpler since we share the same verification flow for both login and registration.
          case "sign-in":
            after(() =>
              emailClient.sendTemplate("RegisterEmail", {
                to: email,
                props: {
                  code: otp,
                },
              }),
            );
            break;
          case "email-verification":
            after(() =>
              emailClient.sendTemplate("RegisterEmail", {
                to: email,
                props: { code: otp },
              }),
            );
            break;
        }
      },
    }),
    ...conditionalPlugins,
  ],
  socialProviders: {
    google:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
            redirectURI: absoluteUrl("/api/auth/callback/google"),
          }
        : undefined,
    microsoft:
      env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET
        ? {
            tenantId: env.MICROSOFT_TENANT_ID,
            clientId: env.MICROSOFT_CLIENT_ID,
            clientSecret: env.MICROSOFT_CLIENT_SECRET,
            redirectURI: absoluteUrl("/api/auth/callback/microsoft-entra-id"),
          }
        : undefined,
  },
  user: {
    additionalFields: {
      timeZone: {
        type: "string",
        input: true,
      },
      locale: {
        type: "string",
        input: true,
      },
    },
  },
  secondaryStorage: kv
    ? {
        set: async (key: string, value: string, ttl?: number) => {
          if (ttl) {
            await kv.set(key, value, { ex: ttl });
          } else {
            await kv.set(key, value);
          }
        },
        get: async (key: string) => kv.get(key),
        delete: async (key: string) => {
          await kv.del(key);
        },
      }
    : undefined,
  rateLimit: {
    enabled: env.RATE_LIMIT_ENABLED !== "false",
    storage: redis ? "secondary-storage" : "memory",
    customRules: {
      "/sign-up/email": {
        window: 60 * 60, // 1 hour
        max: 50,
      },
      "/email-otp/send-verification-otp": {
        window: 60 * 60, // 1 hour
        max: 100,
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
    },
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
        ctx.path.startsWith("/sign-in") ||
        ctx.path.startsWith("/sign-up") ||
        ctx.path.startsWith("/email-otp")
      ) {
        if (ctx.body?.email) {
          if (isEmailBlocked(ctx.body.email as string)) {
            throw new APIError("BAD_REQUEST", {
              code: "EMAIL_BLOCKED",
              message:
                "This email address is not allowed. Please use a different email or contact support.",
            });
          }
          if (isTemporaryEmail(ctx.body.email as string)) {
            throw new APIError("BAD_REQUEST", {
              code: "TEMPORARY_EMAIL_NOT_ALLOWED",
              message:
                "Temporary email addresses are not allowed. Please use a different email.",
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
          if (user.isAnonymous) {
            return;
          }
          // check if user exists in prisma
          const existingUser = await prisma.user.findUnique({
            where: {
              id: user.id,
            },
          });

          if (existingUser) {
            // create a space for the user
            const space = await createSpace({
              name: "Personal",
              ownerId: user.id,
            });

            posthog()?.groupIdentify({
              groupType: "space",
              groupKey: space.id,
              properties: {
                name: space.name,
                memberCount: 1,
                seatCount: 1,
                tier: "hobby",
              },
            });
          }

          posthog()?.capture({
            distinctId: user.id,
            event: "register",
            properties: {
              method: user.lastLoginMethod,
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
          const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { isAnonymous: true, lastLoginMethod: true },
          });

          // Only track login events for non-anonymous users
          // Anonymous users shouldn't trigger login events or create person profiles
          if (user && !user.isAnonymous) {
            posthog()?.capture({
              distinctId: session.userId,
              event: "login",
              properties: { method: user.lastLoginMethod },
            });
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 60, // 60 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  trustedOrigins: [absoluteUrl()],
  baseURL,
});

export type Auth = typeof authLib;

export const getSession = cache(async () => {
  try {
    const session = await authLib.api.getSession({
      headers: await headers(),
    });

    if (session) {
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          isGuest: !!session.user.isAnonymous,
          image: session.user.image,
          locale: session.user.locale ?? undefined,
          timeZone: session.user.timeZone ?? undefined,
        },
        expires: session.session.expiresAt.toISOString(),
      };
    }
  } catch (e) {
    logger.error({ error: e }, "Failed to get session");
    return null;
  }

  return null;
});

export const signOut = async () => {
  await authLib.api.signOut({
    headers: await headers(),
  });
};

export const getUserIdIfLoggedIn = async () => {
  const session = await getSession();
  return session?.user?.isGuest ? undefined : session?.user?.id;
};

export const redirectIfLoggedIn = async () => {
  const session = await getSession();
  if (session?.user && !session.user.isGuest) {
    redirect("/");
  }
};

export default authLib;
