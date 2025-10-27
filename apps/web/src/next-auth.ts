import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@rallly/database";
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
