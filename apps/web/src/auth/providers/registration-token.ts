import { prisma } from "@rallly/database";
import CredentialsProvider from "next-auth/providers/credentials";

import type { RegistrationTokenPayload } from "@/trpc/types";
import { decryptToken } from "@/utils/session";

// When a user registers, we don't want to go through the email verification process
// so this provider allows us exchange the registration token for a session token
export const RegistrationTokenProvider = CredentialsProvider({
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
        credentials.token as string,
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
            image: true,
          },
        });

        if (user) {
          return user;
        }
      }
    }

    return null;
  },
});
