/**
 * Validates a redirect URL to prevent open redirect attacks.
 * Only allows relative URLs starting with "/" but not "//" (protocol-relative).
 *
 * @param redirectTo - The redirect URL to validate
 * @returns The valid redirect URL or undefined if invalid
 */
export function validateRedirectUrl(
  redirectTo?: string | null,
): string | undefined {
  if (!redirectTo) {
    return undefined;
  }

  // Trim whitespace
  const trimmed = redirectTo.trim();

  // Only allow relative URLs starting with "/" but not "//"
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  // Return undefined for invalid redirects, let caller decide the default
  return undefined;
}
