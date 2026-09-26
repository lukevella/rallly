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

// What moderation sees of a pasted link: the origin and path only. A Zoom
// join link carries the meeting password in its query string.
export function moderatedLinkText(uri: string | undefined) {
  if (!uri) {
    return "";
  }
  try {
    const { origin, pathname } = new URL(uri);
    return `${origin}${pathname}`;
  } catch {
    return uri;
  }
}

// How long a captured, correctly signed request stays replayable.
const ZOOM_WEBHOOK_TOLERANCE_MS = 5 * 60_000;

const encoder = new TextEncoder();

function importHmacKey(secretToken: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secretToken),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function fromHex(hex: string) {
  if (!/^(?:[0-9a-f]{2})+$/i.test(hex)) {
    return null;
  }
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Zoom signs every event notification with the app's Secret Token:
// `v0=` + hex HMAC-SHA256 of `v0:{x-zm-request-timestamp}:{raw body}`, the
// timestamp in seconds.
export async function verifyZoomWebhookSignature({
  secretToken,
  signature,
  timestamp,
  body,
  now,
}: {
  secretToken: string;
  signature: string | null;
  timestamp: string | null;
  body: string;
  now: Date;
}): Promise<
  | { ok: true }
  | { ok: false; reason: "missing_headers" | "stale" | "invalid_signature" }
> {
  if (!signature || !timestamp || !/^\d+$/.test(timestamp)) {
    return { ok: false, reason: "missing_headers" };
  }
  if (
    Math.abs(now.getTime() - Number(timestamp) * 1000) >
    ZOOM_WEBHOOK_TOLERANCE_MS
  ) {
    return { ok: false, reason: "stale" };
  }
  const expected = signature.startsWith("v0=")
    ? fromHex(signature.slice(3))
    : null;
  // `verify` compares in constant time, unlike comparing hex strings.
  const valid =
    expected !== null &&
    (await crypto.subtle.verify(
      "HMAC",
      await importHmacKey(secretToken),
      expected,
      encoder.encode(`v0:${timestamp}:${body}`),
    ));
  return valid ? { ok: true } : { ok: false, reason: "invalid_signature" };
}

// The answer to the challenge Zoom sends when the endpoint URL is saved.
export async function createZoomUrlValidationResponse({
  secretToken,
  plainToken,
}: {
  secretToken: string;
  plainToken: string;
}) {
  const encryptedToken = toHex(
    await crypto.subtle.sign(
      "HMAC",
      await importHmacKey(secretToken),
      encoder.encode(plainToken),
    ),
  );
  return { plainToken, encryptedToken };
}
