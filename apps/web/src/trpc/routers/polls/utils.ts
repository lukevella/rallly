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
