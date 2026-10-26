import "server-only";

import { prisma } from "@rallly/database";

/** Whether the user signed in through the instance's OIDC provider. */
export async function hasOidcAccount(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "oidc" },
    select: { id: true },
  });
  return !!account;
}
