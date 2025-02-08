/**
 * This is a modified version of the default Prisma adapter that
 * ignores fields returned by the OAuth provider that are not
 * defined in the database schema when creating an account.
 *
 * This resolves issues where some OAuth providers return unexpected
 * fields in their response which cause the Prisma adapter to throw
 * an error.
 *
 * See: https://github.com/lukevella/rallly/issues/949
 */
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@rallly/database";
import type { Adapter } from "next-auth/adapters";

export function CustomPrismaAdapter(options: {
  migrateData: (userId: string) => Promise<void>;
}) {
  const adapter = PrismaAdapter(prisma);
  return {
    ...adapter,
    linkAccount: async (account) => {
      await options.migrateData(account.userId);
      return prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token as string,
          expires_at: account.expires_at as number,
          id_token: account.id_token as string,
          token_type: account.token_type as string,
          refresh_token: account.refresh_token as string,
          scope: account.scope as string,
          session_state: account.session_state as string,
        },
      });
    },
  } as Adapter;
}
