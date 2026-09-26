import type { ConferencingProvider } from "./schema";
import { isEmailAllowlisted } from "./utils";

export const isConferencingEnabled =
  process.env.CONFERENCING_ENABLED === "true";

// A provider is offered when its OAuth app is configured; Google Meet reuses
// the Google OAuth app the calendars integration already needs.
export function getAvailableConferencingProviders(): ConferencingProvider[] {
  if (!isConferencingEnabled) {
    return [];
  }
  const providers: ConferencingProvider[] = [];
  if (process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET) {
    providers.push("zoom");
  }
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push("meet");
  }
  return providers;
}

// While a provider's allowlist is set, only the listed accounts are offered
// it, for a provider whose OAuth app is not yet published or verified and so
// authorizes nobody else. Unset, the provider is open to everyone.
const providerAllowlists: Record<ConferencingProvider, string | undefined> = {
  zoom: process.env.ZOOM_ALLOWED_EMAILS,
  meet: process.env.GOOGLE_MEET_ALLOWED_EMAILS,
};

export function isConferencingProviderAllowedFor({
  provider,
  email,
}: {
  provider: ConferencingProvider;
  email: string | null;
}) {
  const allowlist = providerAllowlists[provider];
  return !allowlist || isEmailAllowlisted({ email, allowlist });
}

// What this user is offered. Conferencing settings exist for a user only
// while this is non empty.
export function getAvailableConferencingProvidersFor({
  email,
}: {
  email: string | null;
}) {
  return getAvailableConferencingProviders().filter((provider) =>
    isConferencingProviderAllowedFor({ provider, email }),
  );
}
