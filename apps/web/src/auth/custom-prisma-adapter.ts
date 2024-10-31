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
import { ExtendedPrismaClient, PrismaClient } from "@rallly/database";
import { Adapter, AdapterAccount } from "next-auth/adapters";

export function CustomPrismaAdapter(client: ExtendedPrismaClient): Adapter {
  return {
    ...PrismaAdapter(client as PrismaClient),
    linkAccount: (data) => {
      return client.account.create({
        data: {
          userId: data.userId,
          type: data.type,
          provider: data.provider,
          providerAccountId: data.providerAccountId,
          access_token: data.access_token as string,
          expires_at: data.expires_at as number,
          id_token: data.id_token as string,
          token_type: data.token_type as string,
          refresh_token: data.refresh_token as string,
          scope: data.scope as string,
          session_state: data.session_state as string,
        },
      }) as unknown as AdapterAccount;
    },
  };
}
