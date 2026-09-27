// Microsoft vouches for an address in three ways: `email_verified` (rare),
// `xms_edov` (the domain owner verified it, which is what personal Microsoft
// accounts carry) or the `verified_*_email` lists (Entra work accounts). The
// last two are optional claims the app registration must request.
export function isMicrosoftEmailVerified(claims: {
  email?: string | null;
  email_verified?: boolean;
  xms_edov?: boolean;
  verified_primary_email?: string[];
  verified_secondary_email?: string[];
}) {
  if (claims.email_verified === true || claims.xms_edov === true) {
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
