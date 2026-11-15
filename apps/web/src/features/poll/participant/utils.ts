type Voter = { name: string; email?: string };

/**
 * When the instance requires authentication to vote, a guest is refused and
 * the response carries the identity from the identity provider, never what
 * the form sent: the vote is bound to the account that cast it.
 */
export function resolveVoter({
  requireAuth,
  user,
  input,
}: {
  requireAuth: boolean;
  user: { isGuest: boolean; name: string; email: string };
  input: Voter;
}) {
  if (!requireAuth) {
    return { ok: true as const, ...input };
  }

  if (user.isGuest) {
    return { ok: false as const, reason: "authRequired" as const };
  }

  return { ok: true as const, name: user.name, email: user.email };
}
