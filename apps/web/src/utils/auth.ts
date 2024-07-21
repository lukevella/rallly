import { RegistrationTokenPayload } from "@rallly/backend";
import { decryptToken } from "@rallly/backend/session";
import { generateOtp, randomid } from "@rallly/backend/utils/nanoid";
import { prisma } from "@rallly/database";
import {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";
import { NextAuthOptions, User } from "next-auth";
import NextAuth, {
  getServerSession as getServerSessionWithOptions,
} from "next-auth/next";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import EmailProvider from "next-auth/providers/email";
import GoogleProvider from "next-auth/providers/google";
import { Provider } from "next-auth/providers/index";

import { posthog } from "@/app/posthog";
import { env } from "@/env";
import { absoluteUrl } from "@/utils/absolute-url";
import { CustomPrismaAdapter } from "@/utils/auth/custom-prisma-adapter";
import { mergeGuestsIntoUser } from "@/utils/auth/merge-user";
import { emailClient } from "@/utils/emails";
import { getValueByPath } from "@/utils/get-value-by-path";

const providers: Provider[] = [
  // When a user registers, we don't want to go through the email verification process
  // so this provider allows us exchange the registration token for a session token
  CredentialsProvider({
    id: "registration-token",
    name: "Registration Token",
    credentials: {
      token: {
        label: "Token",
        type: "text",
      },
    },
    async authorize(credentials) {
      if (credentials?.token) {
        const payload = await decryptToken<RegistrationTokenPayload>(
          credentials.token,
        );
        if (payload) {
          const user = await prisma.user.findUnique({
            where: {
              email: payload.email,
            },
            select: {
              id: true,
              email: true,
              name: true,
              locale: true,
              timeFormat: true,
              timeZone: true,
            },
          });

          if (user) {
            return user;
          }
        }
      }

      return null;
    },
  }),
  CredentialsProvider({
    id: "guest",
    name: "Guest",
    credentials: {},
    async authorize() {
      return {
        id: `user-${randomid()}`,
        email: null,
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
      const user = await prisma.user.findUnique({
        where: {
          email,
        },
        select: {
          name: true,
        },
      });

      if (user) {
        await emailClient.sendTemplate("LoginEmail", {
          to: email,
          subject: `${token} is your 6-digit code`,
          props: {
            name: user.name,
            magicLink: absoluteUrl("/auth/login", {
              magicLink: url,
            }),
            code: token,
          },
        });
      }
    },
  }),
];

// If we have an OAuth provider configured, we add it to the list of providers
if (
  process.env.OIDC_DISCOVERY_URL &&
  process.env.OIDC_CLIENT_ID &&
  process.env.OIDC_CLIENT_SECRET
) {
  providers.push({
    id: "oidc",
    name: process.env.OIDC_NAME ?? "OpenID Connect",
    type: "oauth",
    wellKnown: process.env.OIDC_DISCOVERY_URL,
    authorization: { params: { scope: "openid email profile" } },
    clientId: process.env.OIDC_CLIENT_ID,
    clientSecret: process.env.OIDC_CLIENT_SECRET,
    idToken: true,
    checks: ["state"],
    allowDangerousEmailAccountLinking: true,
    profile(profile) {
      return {
        id: profile.sub,
        name: getValueByPath(profile, env.OIDC_NAME_CLAIM_PATH),
        email: getValueByPath(profile, env.OIDC_EMAIL_CLAIM_PATH),
        image: getValueByPath(profile, env.OIDC_PICTURE_CLAIM_PATH),
      } as User;
    },
  });
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

if (
  process.env.MICROSOFT_TENANT_ID &&
  process.env.MICROSOFT_CLIENT_ID &&
  process.env.MICROSOFT_CLIENT_SECRET
) {
  providers.push(
    AzureADProvider({
      tenantId: process.env.MICROSOFT_TENANT_ID,
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      wellKnown:
        "https://login.microsoftonline.com/common/v2.0/.well-known/openid-configuration",
    }),
  );
}

const getAuthOptions = (...args: GetServerSessionParams) =>
  ({
    adapter: CustomPrismaAdapter(prisma),
    secret: process.env.SECRET_PASSWORD,
    session: {
      strategy: "jwt",
    },
    providers: providers,
    pages: {
      signIn: "/login",
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
          const isUnregisteredUser =
            (await prisma.user.count({
              where: {
                email: user.email as string,
              },
            })) === 0;

          if (isUnregisteredUser) {
            return false;
          }
        } else {
          // merge guest user into newly logged in user
          const session = await getServerSession(...args);
          if (session && session.user.email === null) {
            await mergeGuestsIntoUser(user.id, [session.user.id]);
          }
        }

        return true;
      },
      async jwt({ token, user, trigger, account, session }) {
        if (trigger === "signUp" && account?.providerAccountId) {
          // merge accounts assigned to provider account id to the current user id
          await mergeGuestsIntoUser(user.id, [account.providerAccountId]);
        }
        if (trigger === "update" && session) {
          if (token.email) {
            // For registered users we want to save the preferences to the database
            try {
              await prisma.user.update({
                where: {
                  id: token.sub,
                },
                data: {
                  locale: session.locale,
                  timeFormat: session.timeFormat,
                  timeZone: session.timeZone,
                  weekStart: session.weekStart,
                  name: session.name,
                },
              });
            } catch (e) {
              console.error("Failed to update user preferences", session);
            }
          }
          token = { ...token, ...session };
        }
        if (trigger === "signIn" && user) {
          token.locale = user.locale;
          token.timeFormat = user.timeFormat;
          token.timeZone = user.timeZone;
          token.weekStart = user.weekStart;
        }
        return token;
      },
      async session({ session, token }) {
        session.user.id = token.sub as string;
        session.user.name = token.name;
        session.user.timeFormat = token.timeFormat;
        session.user.timeZone = token.timeZone;
        session.user.locale = token.locale;
        session.user.weekStart = token.weekStart;
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
