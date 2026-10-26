type VoterInput = { name: string; email?: string | null };

type VoterUser = { isGuest: boolean; name: string; email: string };

/** What the IdP asserted about the user; a claim the IdP omitted is null. */
export type OidcIdentity = { name: string | null; email: string | null };

export type VoterIdentityResult =
  | { ok: true; name: string; email: string | null }
  | { ok: false; reason: "authRequired" };

function readClaim(claims: Record<string, unknown>, path: string) {
  let curr: unknown = claims;
  for (const part of path.split(".")) {
    if (typeof curr !== "object" || curr === null) {
      return null;
    }
    curr = (curr as Record<string, unknown>)[part];
  }
  return typeof curr === "string" && curr ? curr : null;
}

/**
 * Reads the name and email the IdP asserted from the id token stored on the
 * user's OIDC account. The profile name and email can be edited after sign-in,
 * so they are not evidence of what the IdP said. The token was verified when
 * it was received, so its payload is decoded here without checking it again.
 */
export function readOidcIdentity(
  idToken: string | null,
  claimPaths: { name: string; email: string },
): OidcIdentity {
  const none = { name: null, email: null };
  const payload = idToken?.split(".")[1];

  if (!payload) {
    return none;
  }

  try {
    const claims = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    return {
      name: readClaim(claims, claimPaths.name),
      email: readClaim(claims, claimPaths.email),
    };
  } catch {
    return none;
  }
}

/**
 * Decides who a new response is attributed to. With `requireOidc` on, only a
 * user holding a linked OIDC account may vote, and the response carries the
 * identity the IdP asserted rather than whatever the form submitted. Guest
 * sessions are free to mint, so they never count as an authenticated voter.
 * A claim the IdP did not put in its id token falls back to the profile value.
 */
export function resolveVoterIdentity({
  requireOidc,
  user,
  oidcIdentity,
  input,
}: {
  requireOidc: boolean;
  user: VoterUser;
  oidcIdentity: OidcIdentity | null;
  input: VoterInput;
}): VoterIdentityResult {
  if (!requireOidc) {
    return { ok: true, name: input.name, email: input.email ?? null };
  }

  if (user.isGuest || !oidcIdentity) {
    return { ok: false, reason: "authRequired" };
  }

  return {
    ok: true,
    name: oidcIdentity.name ?? user.name,
    email: oidcIdentity.email ?? user.email,
  };
}
