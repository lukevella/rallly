import { TRPCError } from "@trpc/server";
import { createToken, decryptToken } from "@/lib/session";

export async function getUserIdFromToken(
  token: string | undefined,
): Promise<string | null> {
  if (!token) {
    return null;
  }

  const payload = await decryptToken<{ userId: string }>(token);
  return payload?.userId ?? null;
}

export async function createParticipantEditToken(
  userId: string,
): Promise<string> {
  return await createToken(
    { userId },
    {
      ttl: 0, // basically forever
    },
  );
}

export async function resolveUserId(
  token: string | undefined,
  ctxUser: { id: string } | undefined,
): Promise<string> {
  const userId = await tryResolveUserId(token, ctxUser);
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "This method requires a user or valid token",
    });
  }
  return userId;
}

export async function tryResolveUserId(
  token: string | undefined,
  ctxUser: { id: string } | undefined,
): Promise<string | null> {
  const userIdFromToken = await getUserIdFromToken(token);
  return userIdFromToken ?? ctxUser?.id ?? null;
}
