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

// Until Zoom publishes the app, only Zoom's reviewers and the accounts that
// own it can authorize it, so Zoom is offered to the addresses listed here
// alone. Unset, as it is once the app is published, Zoom is open to everyone.
export function isZoomAllowedFor(email: string | null) {
  const allowlist = process.env.ZOOM_ALLOWED_EMAILS;
  return !allowlist || isEmailAllowlisted({ email, allowlist });
}

export function getAvailableConferencingProvidersFor({
  email,
}: {
  email: string | null;
}) {
  return getAvailableConferencingProviders().filter(
    (provider) => provider !== "zoom" || isZoomAllowedFor(email),
  );
}
