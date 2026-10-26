import "server-only";

import { prisma } from "@rallly/database";

/** The user's account at the instance's OIDC provider, if they signed in through it. */
export async function getOidcAccount(userId: string) {
  return prisma.account.findFirst({
    where: { userId, provider: "oidc" },
    select: { id_token: true },
  });
}

/** Whether the user signed in through the instance's OIDC provider. */
export async function hasOidcAccount(userId: string) {
  return !!(await getOidcAccount(userId));
}
