import { prisma } from "@rallly/database";
import { encrypt } from "@rallly/utils/encryption";
import { env } from "@/env";
import type { OAuthTokens } from "@/lib/oauth/types";

export async function saveOAuthCredentials({
  userId,
  provider,
  providerAccountId,
  tokens,
}: {
  userId: string;
  provider: string;
  providerAccountId: string;
  tokens: OAuthTokens;
}) {
  // check if we already have credentials for this provider/account
  const credential = await prisma.credential.findUnique({
    where: {
      user_provider_account_unique: {
        userId,
        provider,
        providerAccountId,
      },
    },
  });

  if (credential) {
    const updatedCredential = await prisma.credential.update({
      where: { id: credential.id },
      data: {
        secret: encrypt(JSON.stringify(tokens), env.SECRET_PASSWORD),
        scopes: tokens.scopes,
        expiresAt: tokens.expiresAt,
      },
    });

    return updatedCredential;
  } else {
    const credential = await prisma.credential.create({
      data: {
        type: "OAUTH",
        userId,
        provider,
        providerAccountId,
        secret: encrypt(JSON.stringify(tokens), env.SECRET_PASSWORD),
        scopes: tokens.scopes,
        expiresAt: tokens.expiresAt,
      },
    });

    return credential;
  }
}
