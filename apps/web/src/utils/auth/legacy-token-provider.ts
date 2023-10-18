import { decryptToken } from "@rallly/backend/session";
import { prisma, TimeFormat } from "@rallly/database";
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
          preferences?: {
            weekStart?: number;
            timeZone?: string;
            timeFormat?: TimeFormat;
          };
        };
      }>(credentials.token);

      if (session?.user) {
        if (session.user.isGuest) {
          return {
            id: session.user.id,
            email: null,
            weekStart: session.user.preferences?.weekStart,
            timeZone: session.user.preferences?.timeZone,
            timeFormat: session.user.preferences?.timeFormat,
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
            };
          }
        }
      }
    }

    return null;
  },
});
