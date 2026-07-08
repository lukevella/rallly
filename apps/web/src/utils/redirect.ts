// A leading-"/" check alone is not enough: the WHATWG URL parser resolves
// "//evil.com", "/\evil.com" and even "/\t/evil.com" (tabs/newlines are
// stripped) to an external origin. Resolving against a sentinel origin uses
// the same parser the redirect will, so nothing can slip through.
const PROBE_ORIGIN = "https://redirect-probe.invalid";

/**
 * Validates a redirect URL to prevent open redirect attacks.
 * Only allows app-relative URLs that cannot resolve to another origin.
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

  const trimmed = redirectTo.trim();

  if (!trimmed.startsWith("/")) {
    return undefined;
  }

  try {
    if (new URL(trimmed, PROBE_ORIGIN).origin !== PROBE_ORIGIN) {
      return undefined;
    }
  } catch {
    return undefined;
  }

  return trimmed;
}

/**
 * Builds a destination URL with a validated `redirectTo` query parameter.
 */
export function buildSafeRedirectUrl({
  destination,
  returnUrl,
}: {
  destination: string;
  returnUrl?: string | null;
}) {
  if (returnUrl === "/") {
    return destination;
  }

  const validated = validateRedirectUrl(returnUrl);
  if (!validated) {
    return destination;
  }
  const searchParams = new URLSearchParams();
  searchParams.set("redirectTo", validated);
  return `${destination}?${searchParams.toString()}`;
}
