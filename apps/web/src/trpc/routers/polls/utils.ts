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

export async function tryResolveUserId(
  token: string | undefined,
  ctxUser: { id: string } | undefined,
): Promise<string | null> {
  const userIdFromToken = await getUserIdFromToken(token);
  return userIdFromToken ?? ctxUser?.id ?? null;
}

type Actor = { id: string; isGuest: boolean };

/**
 * Resolve the acting user along with whether they should be treated as a guest
 * for analytics (person-processing) purposes.
 *
 * Participant/comment edit tokens are only ever issued to guest participants,
 * so a token-resolved actor is treated as a guest. A signed-in real user always
 * acts through their session (`ctxUser`), never a token.
 */
export async function tryResolveActor(
  token: string | undefined,
  ctxUser: Actor | undefined,
): Promise<Actor | null> {
  const userIdFromToken = await getUserIdFromToken(token);
  if (userIdFromToken) {
    return { id: userIdFromToken, isGuest: true };
  }
  if (ctxUser) {
    return { id: ctxUser.id, isGuest: ctxUser.isGuest };
  }
  return null;
}

export async function resolveActor(
  token: string | undefined,
  ctxUser: Actor | undefined,
): Promise<Actor> {
  const actor = await tryResolveActor(token, ctxUser);
  if (!actor) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "This method requires a user or valid token",
    });
  }
  return actor;
}
