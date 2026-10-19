import type { ConferencingProvider } from "./schema";
import { integrationIdToConferencingProvider } from "./utils";

// The providers the operator turned on, by integration id
// (`CONFERENCING_PROVIDERS=google-meet,zoom`). Each maps onto a future
// Control Panel toggle. env.ts rejects unknown ids at boot.
export const enabledConferencingProviders: ConferencingProvider[] = (
  process.env.CONFERENCING_PROVIDERS ?? ""
)
  .split(",")
  .flatMap((entry) => {
    const provider = integrationIdToConferencingProvider(
      entry.trim().toLowerCase(),
    );
    return provider ? [provider] : [];
  });

export const isConferencingEnabled = enabledConferencingProviders.length > 0;

export const CONFERENCING_SETUP_DOCS_URL =
  "https://support.rallly.co/self-hosting/conferencing";

// Providers whose OAuth app is configured. Google Meet reuses the Google
// OAuth app the calendars integration already needs, and Microsoft Teams the
// Microsoft app sign in uses. Webex has an integration of its own.
export function getConfiguredConferencingProviders(): ConferencingProvider[] {
  const providers: ConferencingProvider[] = [];
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    providers.push("meet");
  }
  if (process.env.ZOOM_CLIENT_ID && process.env.ZOOM_CLIENT_SECRET) {
    providers.push("zoom");
  }
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    providers.push("teams");
  }
  if (process.env.WEBEX_CLIENT_ID && process.env.WEBEX_CLIENT_SECRET) {
    providers.push("webex");
  }
  return providers;
}

// A provider is offered when the operator turned it on and its OAuth app is
// configured. Shared credentials alone (Google or Microsoft sign in) never
// turn on Meet or Teams.
export function getAvailableConferencingProviders(): ConferencingProvider[] {
  const configured = getConfiguredConferencingProviders();
  return enabledConferencingProviders.filter((provider) =>
    configured.includes(provider),
  );
}

// `offline_access` is what makes Microsoft issue a refresh token.
export const MICROSOFT_TEAMS_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "User.Read",
  "OnlineMeetings.ReadWrite",
];

// Both are scopes a user grants for themselves; no Webex review is involved.
export const WEBEX_SCOPES = ["meeting:schedules_write", "spark:people_read"];
