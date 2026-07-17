import { stripe } from "@rallly/billing";
import type { TimeFormat } from "@rallly/database";
import { prisma } from "@rallly/database";
import { sendChangeEmailEmail } from "@rallly/emails/templates/change-email";
import { sendRegisterEmail } from "@rallly/emails/templates/register";
import { sendResetPasswordEmail } from "@rallly/emails/templates/reset-password";
import { createLogger } from "@rallly/logger";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { BetterAuthPlugin } from "better-auth";
import { APIError, betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
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
import { getInstanceBranding } from "@/emails/branding";
import { env } from "@/env";
import { linkAnonymousUser } from "@/features/auth/mutations";
import { isEmailBlocked, isTemporaryEmail } from "@/features/auth/utils";
import { createSpace } from "@/features/space/mutations";
import type { UserDTO } from "@/features/user/schema";
import { getTranslation } from "@/i18n/server";
import { getLocale } from "@/i18n/server/get-locale";
import { hostOnlyCookieCleanup } from "@/lib/auth-plugins/host-only-cookie-cleanup";
import { redis } from "@/lib/kv";
import {
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_OPTIONS,
} from "@/lib/locale/constants";
import { identifyGroup, track } from "@/lib/posthog";
import { getValueByPath } from "@/lib/utils/get-value-by-path";

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

      await sendResetPasswordEmail({
        to: user.email,
        locale,
        branding: await getInstanceBranding(),
        props: { resetLink: url },
      });
    },
    onPasswordReset: async ({ user }) => {
      // Guests have no credentials, so this is always an identified user.
      track({ id: user.id, isGuest: false }, { event: "password_reset" });
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
      // Sign-up via OTP is allowed so that registering for an event can either
      // log a guest into their existing account or create one for a new email.
      // The login page is unaffected: it sends "email-verification" OTPs and
      // verifies with verifyEmail, neither of which is gated by this flag.
      disableSignUp: false,
      expiresIn: 15 * 60,
      resendStrategy: "reuse",
      overrideDefaultEmailVerification: true,
      changeEmail: {
        enabled: true,
      },
      async sendVerificationOTP({ email, otp, type }) {
        const locale = await getLocale(); // TODO: Get locale from email
        const branding = await getInstanceBranding();
        switch (type) {
          // We're not actually using the sign-in type anymore since we just we have `autoSignInAfterVerification` enabled.
          // This lets us keep things a bit simpler since we share the same verification flow for both login and registration.
          case "sign-in":
          case "email-verification":
            after(() =>
              sendRegisterEmail({
                to: email,
                locale,
                branding,
                props: { code: otp },
              }),
            );
            break;
          case "change-email":
            after(() =>
              sendChangeEmailEmail({
                to: email,
                locale,
                branding,
                props: { code: otp },
              }),
            );
            break;
        }
      },
    }),
    ...conditionalPlugins,
    hostOnlyCookieCleanup,
    // Must be last — applies Set-Cookie headers from auth.api calls made in
    // server actions and route handlers.
    nextCookies(),
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
      timeFormat: {
        type: "string",
        input: true,
        required: false,
      },
      weekStart: {
        type: "number",
        input: true,
        required: false,
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
      "/email-otp/request-email-change": {
        window: 60 * 60, // 1 hour
        max: 5,
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
        // The email change endpoints submit the address as `newEmail`
        const email = (ctx.body?.email ?? ctx.body?.newEmail) as
          | string
          | undefined;
        if (email) {
          if (isEmailBlocked(email)) {
            throw new APIError("BAD_REQUEST", {
              code: "EMAIL_BLOCKED",
              message:
                "This email address is not allowed. Please use a different email or contact support.",
            });
          }
          if (isTemporaryEmail(email)) {
            throw new APIError("BAD_REQUEST", {
              code: "TEMPORARY_EMAIL_NOT_ALLOWED",
              message:
                "Temporary email addresses are not allowed. Please use a different email.",
            });
          }
        }

        // Reject banned users before a verification code goes out — the
        // admin plugin only enforces bans at session creation, which is
        // after the OTP email has already been sent. Keyed off `email`
        // only: the change-email endpoints submit `newEmail` and already
        // require a session, which a banned user cannot hold.
        const accountEmail = ctx.body?.email as string | undefined;
        if (accountEmail) {
          const user = await prisma.user.findUnique({
            where: { email: accountEmail },
            select: { banned: true },
          });
          if (user?.banned) {
            throw new APIError("FORBIDDEN", {
              code: "BANNED_USER",
              message: "You have been banned from this application",
            });
          }
        }
      }
    }),
    after: createAuthMiddleware(async (ctx) => {
      // Locale cookie writes go through better-auth's response
      // (ctx.setCookie), never next/headers: mutating Next's cookie store
      // makes Next rebuild this handler's Set-Cookie headers through a
      // name-keyed map, which collapses the duplicate-name session cookies
      // that crossSubDomainCookies + hostOnlyCookieCleanup produce and
      // drops the real one. And it must happen in this hook rather than a
      // database hook: create.after runs after the transaction, once the
      // response cookies can no longer be changed.
      if (ctx.path === "/sign-out") {
        const returned = ctx.context.returned as
          | { success?: boolean }
          | undefined;

        // The locale cookie projects the signed-out user's preference;
        // revert to accept-language for whoever uses this device next.
        if (returned?.success === true) {
          ctx.setCookie(LOCALE_COOKIE_NAME, "", {
            ...LOCALE_COOKIE_OPTIONS,
            maxAge: 0,
          });
        }
        return;
      }

      // A new session in the response means the user just signed in:
      // adopt their saved language on this device.
      const newSessionUser = ctx.context.newSession?.user as
        | { locale?: string | null }
        | undefined;
      if (newSessionUser?.locale) {
        ctx.setCookie(
          LOCALE_COOKIE_NAME,
          newSessionUser.locale,
          LOCALE_COOKIE_OPTIONS,
        );
      }

      if (
        ctx.path !== "/email-otp/request-email-change" &&
        ctx.path !== "/email-otp/change-email"
      ) {
        return;
      }

      const returned = ctx.context.returned as
        | { success?: boolean }
        | undefined;

      if (returned?.success !== true) {
        return;
      }

      const path = ctx.path;
      const newEmail = (ctx.body?.newEmail as string).toLowerCase();

      // Run side effects after the response so they can't fail or delay an
      // email change that Better-Auth has already accepted.
      after(async () => {
        try {
          const session = await getSessionFromCtx(ctx);

          if (!session) {
            return;
          }

          if (path === "/email-otp/request-email-change") {
            // Email changes are only available to registered users.
            track(
              { id: session.user.id, isGuest: false },
              {
                event: "account_email_change_request",
                properties: {
                  fromEmail: session.user.email,
                  toEmail: newEmail,
                },
              },
            );
            return;
          }

          const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { customerId: true },
          });

          if (user?.customerId) {
            try {
              await stripe.customers.update(user.customerId, {
                email: newEmail,
              });
            } catch (error) {
              logger.error(
                { error },
                "Failed to update Stripe customer email after email change",
              );
            }
          }

          track(
            { id: session.user.id, isGuest: false },
            {
              event: "account_email_change_complete",
              properties: {
                $set: {
                  email: newEmail,
                },
              },
            },
          );
        } catch (error) {
          logger.error({ error }, "Failed to run email change side effects");
        }
      });
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

            identifyGroup({
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

          track(
            { id: user.id, isGuest: false },
            {
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
            },
          );
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          after(async () => {
            const user = await prisma.user
              .update({
                where: { id: session.userId },
                data: { lastSeenAt: new Date() },
                select: { isAnonymous: true, lastLoginMethod: true },
              })
              .catch(() => null);

            // Anonymous users shouldn't trigger login events or create person profiles.
            if (user && !user.isAnonymous) {
              track(
                { id: session.userId, isGuest: false },
                {
                  event: "login",
                  properties: { method: user.lastLoginMethod },
                },
              );
            }
          });
        },
      },
      update: {
        after: async (session) => {
          after(() =>
            prisma.user
              .update({
                where: { id: session.userId },
                data: { lastSeenAt: new Date() },
              })
              .catch((error) => {
                logger.error(
                  { error, userId: session.userId },
                  "Failed to update lastSeenAt",
                );
                return null;
              }),
          );
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
  advanced: env.NEXT_PUBLIC_COOKIE_DOMAIN
    ? {
        crossSubDomainCookies: {
          enabled: true,
          domain: env.NEXT_PUBLIC_COOKIE_DOMAIN,
        },
      }
    : undefined,
  trustedOrigins: [absoluteUrl()],
  baseURL,
});

export type Auth = typeof authLib;

const parseTimeFormat = (value: unknown): TimeFormat | undefined =>
  value === "hours12" || value === "hours24" ? value : undefined;

export type SessionData = {
  user: UserDTO;
  expires: string;
  updatedAt: string;
};

/**
 * "Couldn't read the session" (session store unreachable, transient
 * failure) is not the same as "there is no session". Redirect guards must
 * not treat an error as either logged-in or logged-out — reacting to an
 * unknown state is what turns a transient failure into a redirect loop
 * between / and /login.
 */
export type SessionState =
  | { status: "authenticated"; session: SessionData }
  | { status: "unauthenticated" }
  | { status: "error" };

export const getSessionState = cache(async (): Promise<SessionState> => {
  try {
    const session = await authLib.api.getSession({
      headers: await headers(),
    });

    if (session) {
      const user: UserDTO = {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        isGuest: !!session.user.isAnonymous,
        image: session.user.image ?? undefined,
        role: session.user.role === "admin" ? "admin" : "user",
        banned: !!session.user.banned,
        locale: session.user.locale ?? undefined,
        timeZone: session.user.timeZone || undefined,
        timeFormat: parseTimeFormat(session.user.timeFormat),
        weekStart: session.user.weekStart ?? undefined,
      };

      return {
        status: "authenticated",
        session: {
          user,
          expires: session.session.expiresAt.toISOString(),
          updatedAt: session.session.updatedAt.toISOString(),
        },
      };
    }
  } catch (e) {
    logger.error({ error: e }, "Failed to get session");
    return { status: "error" };
  }

  return { status: "unauthenticated" };
});

/**
 * Session-or-null view for callers where an unreadable session can safely
 * degrade to "no session" (optional personalization, public reads). Guards
 * that redirect or gate access should use getSessionState instead.
 */
export const getSession = async () => {
  const state = await getSessionState();
  return state.status === "authenticated" ? state.session : null;
};

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
  const state = await getSessionState();
  // On "error" the session is unknown — render the page rather than
  // redirect, so a transient session-store failure can't feed a loop.
  if (state.status === "authenticated" && !state.session.user.isGuest) {
    redirect("/");
  }
};

export default authLib;
