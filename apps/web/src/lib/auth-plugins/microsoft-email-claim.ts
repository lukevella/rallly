// Microsoft only vouches for an address when the app registration requests
// the verified email optional claims. Their absence means the registration is
// unconfigured, which is a different situation from Microsoft declining to
// vouch, and the two need different handling downstream.
//
// The claim is only visible where the ID token is decoded (the provider's
// profile mapping), while the decision is made in the user create hook, which
// sees the mapped user only. The registry carries the reading between the two
// within one sign-in; entries are consumed on read and expire quickly.

export type MicrosoftEmailClaim = "verified" | "unverified" | "absent";

export function readMicrosoftEmailClaim(profile: {
  email?: string | undefined;
  email_verified?: boolean | undefined;
  verified_primary_email?: string[] | undefined;
  verified_secondary_email?: string[] | undefined;
}): MicrosoftEmailClaim {
  if (typeof profile.email_verified === "boolean") {
    return profile.email_verified ? "verified" : "unverified";
  }
  const primary = profile.verified_primary_email;
  const secondary = profile.verified_secondary_email;
  if (!Array.isArray(primary) && !Array.isArray(secondary)) {
    return "absent";
  }
  // Exact match, the same comparison better-auth makes when it derives
  // emailVerified from these claims, so the two readings never disagree.
  const email = profile.email;
  const verified =
    !!email && [...(primary ?? []), ...(secondary ?? [])].includes(email);
  return verified ? "verified" : "unverified";
}

const TTL_MS = 60_000;

const pending = new Map<string, { claim: MicrosoftEmailClaim; at: number }>();

export function rememberMicrosoftEmailClaim({
  email,
  claim,
}: {
  email: string;
  claim: MicrosoftEmailClaim;
}) {
  const now = Date.now();
  for (const [key, entry] of pending) {
    if (now - entry.at > TTL_MS) {
      pending.delete(key);
    }
  }
  pending.set(email.toLowerCase(), { claim, at: now });
}

export function takeMicrosoftEmailClaim(email: string) {
  const key = email.toLowerCase();
  const entry = pending.get(key);
  pending.delete(key);
  if (!entry || Date.now() - entry.at > TTL_MS) {
    return undefined;
  }
  return entry.claim;
}
