import { decryptToken } from "@rallly/backend/session";
import { prisma } from "@rallly/database";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * This provider allows us to login with a token from an older session created with
 * iron-session.
 *
 * We should keep this provider available for at least 30 days in production to allow returning
 * users to keep their existing sessions.
 *
 * @deprecated
 */
export const LegacyTokenProvider = CredentialsProvider({
  id: "legacy-token",
  name: "Legacy Token",
  credentials: {
    token: {
      label: "Token",
      type: "text",
    },
  },
  async authorize(credentials) {
    if (credentials?.token) {
      const session = await decryptToken<{
        user: {
          id: string;
          isGuest: boolean;
        };
      }>(credentials.token);

      if (session?.user) {
        if (session.user.isGuest) {
          return {
            id: session.user.id,
            isGuest: true,
            email: null,
            name: "Guest",
          };
        } else {
          const user = await prisma.user.findUnique({
            where: {
              id: session.user.id,
            },
            select: {
              id: true,
              email: true,
              name: true,
            },
          });

          if (user) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              isGuest: false,
            };
          }
        }
      }
    }

    return null;
  },
});
