type VoterInput = { name: string; email?: string | null };

type VoterUser = { isGuest: boolean; name: string; email: string };

export type VoterIdentityResult =
  | { ok: true; name: string; email: string | null }
  | { ok: false; reason: "authRequired" };

/**
 * Decides who a new response is attributed to. With `requireOidc` on, only a
 * user holding a linked OIDC account may vote, and the response carries the
 * identity the IdP asserted rather than whatever the form submitted. Guest
 * sessions are free to mint, so they never count as an authenticated voter.
 */
export function resolveVoterIdentity({
  requireOidc,
  user,
  hasOidcAccount,
  input,
}: {
  requireOidc: boolean;
  user: VoterUser;
  hasOidcAccount: boolean;
  input: VoterInput;
}): VoterIdentityResult {
  if (!requireOidc) {
    return { ok: true, name: input.name, email: input.email ?? null };
  }

  if (user.isGuest || !hasOidcAccount) {
    return { ok: false, reason: "authRequired" };
  }

  return { ok: true, name: user.name, email: user.email };
}
