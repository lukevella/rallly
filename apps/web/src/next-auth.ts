import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@rallly/database";
import { posthog } from "@rallly/posthog/server";
import NextAuth from "next-auth";
import { env } from "@/env";
import { GuestProvider } from "./auth/providers/guest";

const { auth, handlers, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  secret: env.SECRET_PASSWORD,
  adapter: PrismaAdapter(prisma),
  providers: [GuestProvider],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/auth/error",
  },
  jwt: {
    maxAge: 60 * 60 * 24 * 60,
  },
  cookies: {
    sessionToken: {
      options: {
        maxAge: 60 * 60 * 24 * 60,
      },
    },
  },
  events: {
    createUser({ user }) {
      if (user.id) {
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
      }
    },
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
              timeZone: user.timeZone ?? undefined,
              locale: user.locale ?? undefined,
            },
          },
        });
      }
    },
  },
  callbacks: {
    async jwt({ token }) {
      const userId = token.sub;
      const isGuest = !token.email;

      if (userId && !isGuest) {
        const user = await prisma.user.findUnique({
          where: {
            id: userId,
          },
          select: {
            name: true,
            email: true,
            image: true,
          },
        });

        if (user) {
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.email = token.email ? token.email : "";
        session.user.image = token.picture;
        session.user.isGuest = !token.email;
      }

      return session;
    },
  },
});

export { auth, handlers, signIn, signOut };
