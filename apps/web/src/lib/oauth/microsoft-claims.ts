// Microsoft vouches for an address in three ways: `email_verified` (rare),
// `xms_edov` (the domain owner verified it, which is what personal Microsoft
// accounts carry) or the `verified_*_email` lists (Entra work accounts). The
// last two are optional claims the app registration must request.
export function isMicrosoftEmailVerified(claims: {
  email?: string | null;
  email_verified?: boolean;
  xms_edov?: boolean | string | number;
  verified_primary_email?: string[];
  verified_secondary_email?: string[];
}) {
  if (claims.email_verified === true || isTruthyClaim(claims.xms_edov)) {
    return true;
  }
  const email = claims.email?.toLowerCase();
  if (!email) {
    return false;
  }
  return [
    ...(claims.verified_primary_email ?? []),
    ...(claims.verified_secondary_email ?? []),
  ].some((verified) => verified.toLowerCase() === email);
}

// Microsoft documents `xms_edov` as a boolean but emits it as the string "1"
// for personal accounts.
function isTruthyClaim(value: boolean | string | number | undefined) {
  return value === true || value === 1 || value === "1" || value === "true";
}
