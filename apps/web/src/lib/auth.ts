import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { BetterAuthPlugin } from "better-auth";
import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import {
  admin,
  anonymous,
  createAuthMiddleware,
  emailOTP,
  genericOAuth,
  lastLoginMethod,
} from "better-auth/plugins";
import { headers } from "next/headers";
import { cache } from "react";
import { isEmailBlocked } from "@/auth/helpers/is-email-blocked";
import {
  linkAnonymousUser,
  mergeGuestsIntoUser,
} from "@/auth/helpers/merge-user";
import { isTemporaryEmail } from "@/auth/helpers/temp-email-domains";
import { env } from "@/env";
import { createSpace } from "@/features/space/mutations";
import { getTranslation } from "@/i18n/server";
import { getLocale } from "@/i18n/server/get-locale";
import { isKvEnabled, kv } from "@/lib/kv";
import { auth as legacyAuth, signOut as legacySignOut } from "@/next-auth";
import { getEmailClient } from "@/utils/emails";
import { getValueByPath } from "@/utils/get-value-by-path";

const baseURL = absoluteUrl("/api/better-auth");

const plugins: BetterAuthPlugin[] = [];

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
  emailAndPassword: {
    enabled: env.EMAIL_LOGIN_ENABLED !== "false",
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const locale =
        "locale" in user ? (user.locale as string) : await getLocale();

      await getEmailClient(locale).sendTemplate("ResetPasswordEmail", {
        to: user.email,
        props: {
          resetLink: url,
        },
      });
    },
    onPasswordReset: async ({ user }) => {
      posthog?.capture({
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
    ...plugins,
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
        const emailClient = getEmailClient(locale);
        switch (type) {
          // We're not actually using the sign-in type anymore since we just we have `autoSignInAfterVerification` enabled.
          // This lets us keep things a bit simpler since we share the same verification flow for both login and registration.
          case "sign-in":
            await emailClient.sendTemplate("RegisterEmail", {
              to: email,
              props: {
                code: otp,
              },
            });
            break;
          case "email-verification":
            await emailClient.sendTemplate("RegisterEmail", {
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
      locale: {
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
            await createSpace({ name: "Personal", ownerId: user.id });
          }

          posthog?.capture({
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
          // Merge legacy guest users into new user
          const legacySession = await legacyAuth();

          if (legacySession) {
            if (legacySession.user?.isGuest) {
              await mergeGuestsIntoUser(session.userId, legacySession.user.id);
            }
            // Delete legacy session
            await legacySignOut({
              redirect: false,
            });
          }

          posthog?.capture({
            distinctId: session.userId,
            event: "login",
          });
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
        },
        expires: session.session.expiresAt.toISOString(),
        legacy: false,
      };
    }
  } catch (e) {
    console.error("FAILED TO GET SESSION", e);
    return null;
  }

  // Fallback to legacy auth
  // TODO: Remove this once we have fully migrated to better-auth and there are no active legacy sessions left
  try {
    const legacySession = await legacyAuth();
    if (legacySession) {
      return {
        ...legacySession,
        legacy: true,
      };
    }
  } catch (e) {
    console.error("FAILED TO GET LEGACY SESSION", e);
    return null;
  }

  return null;
});

export const signOut = async () => {
  await Promise.all([
    authLib.api.signOut({
      headers: await headers(),
    }),
    legacySignOut({
      redirect: false,
    }),
  ]);
};

export const getUserIdIfLoggedIn = async () => {
  const session = await getSession();
  return session?.user?.isGuest ? undefined : session?.user?.id;
};
