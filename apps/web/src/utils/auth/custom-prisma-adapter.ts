import { PrismaAdapter } from "@auth/prisma-adapter";
import { Prisma, PrismaClient } from "@prisma/client";
import { Adapter } from "next-auth/adapters";

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  const adapter = PrismaAdapter(prisma);
  return {
    ...adapter,
    // NOTE: Some users have inboxes with spam filters that check all links before they are delivered.
    // This means the verification link will be used before the user gets it. To get around this, we
    // avoid deleting the verification token when it is used. Instead we delete all verification tokens
    // for an email address when a new verification token is created.
    async createVerificationToken(data) {
      await prisma.verificationToken.deleteMany({
        where: { identifier: data.identifier },
      });

      const verificationToken = await prisma.verificationToken.create({
        data,
      });

      return verificationToken;
    },
    async useVerificationToken(identifier_token) {
      try {
        const verificationToken = await prisma.verificationToken.findUnique({
          where: { identifier_token },
        });
        return verificationToken;
      } catch (error) {
        // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
        if ((error as Prisma.PrismaClientKnownRequestError).code === "P2025")
          return null;
        throw error;
      }
    },
  };
}
