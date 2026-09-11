import type { ConferencingProvider } from "./schema";

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
