import { TRPCError } from "@trpc/server";
import { createToken, decryptToken } from "@/utils/session";

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
  const userIdFromToken = await getUserIdFromToken(token);
  const userId = userIdFromToken ?? ctxUser?.id;
  if (!userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "This method requires a user or valid token",
    });
  }
  return userId;
}
