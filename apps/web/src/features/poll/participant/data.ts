import "server-only";

import { prisma } from "@rallly/database";

/** Whether the user has ever linked an account at the instance's OIDC provider. */
export async function hasOidcAccount(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "oidc" },
    select: { id: true },
  });
  return !!account;
}

/**
 * The user's OIDC account, but only while OIDC is how they last signed in.
 * Account linking lets the same user also sign in by email, and a linked
 * account says nothing about the session at hand. The last login method is
 * the closest per-user signal of that; it is not bound to the session, so a
 * later email login elsewhere also revokes it.
 */
export async function getOidcLogin(userId: string) {
  return prisma.account.findFirst({
    where: { userId, provider: "oidc", user: { lastLoginMethod: "oidc" } },
    select: { id_token: true },
  });
}

export async function hasOidcLogin(userId: string) {
  return !!(await getOidcLogin(userId));
}
