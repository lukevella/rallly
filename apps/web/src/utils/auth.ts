import { PrismaAdapter } from "@auth/prisma-adapter";
import { RegistrationTokenPayload } from "@rallly/backend";
import { decryptToken } from "@rallly/backend/session";
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

import { absoluteUrl } from "@/utils/absolute-url";
import { mergeGuestsIntoUser } from "@/utils/auth/merge-user";
import { emailClient } from "@/utils/emails";

const getAuthOptions = (...args: GetServerSessionParams) =>
  ({
    adapter: PrismaAdapter(prisma),
    secret: process.env.SECRET_PASSWORD,
    session: {
      strategy: "jwt",
    },
    providers: [
      // When a user registers, we don't want to go through the email verification process
      // so this providers allows us exchange the registration token for a session token
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
      {
        id: "",
        name: "",
        type: "oauth",
        wellKnown: "http://localhost:8000/.well-known/openid-configuration",
        authorization: { params: { scope: "openid" } },
        clientId: "",
        clientSecret: "",
        idToken: true,
        checks: ["state"],
        userinfo: {
          async request(context) {
            return await context.client.userinfo(
              context.tokens.access_token ?? "",
            );
          },
        },
        profile(profile) {
          return {
            id: profile.sub,
            name: profile.name,
            email: profile.email,
          };
        },
      },
    ],
    pages: {
      signIn: "/login",
      signOut: "/logout",
      error: "/auth/error",
    },
    callbacks: {
      async signIn({ user, email, account, profile }) {
        if (email?.verificationRequest) {
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
        } else {
          if (profile && account?.type === "oauth") {
            // The sign in was initiated by an OAuth provider in response to a request initiated by the user

            const existing_account = await prisma.account.findFirst({
              select: {
                userId: true,
              },
              where: {
                providerAccountId: account.providerAccountId,
                provider: account.provider,
              },
            });

            // If there is not an existing Rallly user, that is already linked to the provider account
            // we need to link a (new or existing) Rallly user to the provider account
            if (!existing_account) {
              if (!profile.name || !profile.email) {
                throw new Error(
                  "Failed to authenticate user as the profile did not return a name and an email",
                );
              }

              // If there is an existing Rallly user with the same email as the OAuth profile
              // we want to link the provider account to that user
              // Otherwise we want to create a new user and link the provider account to that user
              var existing_user = await prisma.user.findUnique({
                where: {
                  email: profile.email,
                },
              });

              if (!existing_user) {
                // Create a new user
                existing_user = await prisma.user.create({
                  data: {
                    name: profile.name,
                    email: profile.email,
                  },
                });
              }

              // Now we have a Rallly user, we link the provider account to this user
              await prisma.account.create({
                data: {
                  userId: existing_user.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              });
            }

            // We can update `user` email and id to allow Rallly to merge guests into the user
            user.email = profile.email;
            user.id = existing_account?.userId ?? user.id;
          }
          if (user.email) {
            // merge guest user into newly logged in user
            const session = await getServerSession(...args);
            if (session && session.user.email === null) {
              await mergeGuestsIntoUser(user.id, [session.user.id]);
            }
          }
        }

        return true;
      },
      async jwt({ token, user, trigger, session }) {
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
  } satisfies NextAuthOptions);

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
