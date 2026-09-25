import * as z from "zod";
import type { Conferencing, ConferencingProvider } from "./schema";

// Which OAuth integration backs each provider. Google Meet shares the Google
// OAuth app (and credential row) with Google Calendar.
export const conferencingProviderIntegrations: Record<
  ConferencingProvider,
  { integrationId: string; oauthProvider: string }
> = {
  zoom: { integrationId: "zoom", oauthProvider: "zoom" },
  meet: { integrationId: "google-meet", oauthProvider: "google" },
};

export function integrationIdToConferencingProvider(
  integrationId: string,
): ConferencingProvider | null {
  for (const [provider, integration] of Object.entries(
    conferencingProviderIntegrations,
  )) {
    if (integration.integrationId === integrationId) {
      return provider as ConferencingProvider;
    }
  }
  return null;
}

export const conferencingProviderLabels: Record<ConferencingProvider, string> =
  {
    zoom: "Zoom",
    meet: "Google Meet",
  };

export const zoomMeetingResponseSchema = z.object({
  id: z.number(),
  join_url: z.url(),
  password: z.string().optional(),
});

export function zoomMeetingToConferencing(
  meeting: z.infer<typeof zoomMeetingResponseSchema>,
): Conferencing {
  return {
    provider: "zoom",
    uri: meeting.join_url,
    meetingId: String(meeting.id),
    password: meeting.password || undefined,
  };
}

export const meetSpaceResponseSchema = z.object({
  meetingUri: z.url(),
  meetingCode: z.string().optional(),
});

export function meetSpaceToConferencing(
  space: z.infer<typeof meetSpaceResponseSchema>,
): Conferencing {
  return {
    provider: "meet",
    uri: space.meetingUri,
    meetingId: space.meetingCode,
  };
}

// Returns the URI suitable for an href / ICS CONFERENCE value.
// Phone numbers are formatted as `tel:` with DTMF pause + extension if present.
export function getConferencingUri(conferencing: Conferencing): string {
  if (conferencing.provider === "phone") {
    return conferencing.extension
      ? `tel:${conferencing.number},,${conferencing.extension}`
      : `tel:${conferencing.number}`;
  }
  return conferencing.uri;
}

// The host a pasted link points at, shown next to the organizer's label so a
// label like "Zoom" cannot mask where the link really goes.
export function getLinkHost(uri: string): string | null {
  try {
    return new URL(uri).hostname || null;
  } catch {
    return null;
  }
}
