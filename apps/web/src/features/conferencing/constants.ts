import type { ConferencingProvider } from "./schema";

export const isConferencingEnabled =
  process.env.CONFERENCING_ENABLED === "true";

// A provider is offered when its OAuth app is configured; Google Meet reuses
// the Google OAuth app the calendars integration already needs, and Microsoft
// Teams the Microsoft app sign in uses. Webex has an integration of its own.
export function getAvailableConferencingProviders(): ConferencingProvider[] {
  if (!isConferencingEnabled) {
    return [];
  }
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
