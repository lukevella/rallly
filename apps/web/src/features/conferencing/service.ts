import "server-only";

import { createLogger } from "@rallly/logger";
import { google } from "googleapis";
import { env } from "@/env";
import { loadCredential } from "@/features/credentials/data";
import { updateOAuthCredentialTokens } from "@/features/credentials/mutations";
import type { OAuthCredentials } from "@/features/credentials/schema";
import { ZoomOAuthClient } from "@/lib/oauth/providers/zoom";
import { getConferencingConnectionForProvider } from "./data";
import type { Conferencing, ConferencingProvider } from "./schema";
import {
  meetSpaceResponseSchema,
  meetSpaceToConferencing,
  zoomMeetingResponseSchema,
  zoomMeetingToConferencing,
} from "./utils";

const logger = createLogger("conferencing/service");

export type CreateConferencingMeetingResult =
  | { ok: true; conferencing: Conferencing }
  | { ok: false; reason: "not_connected" | "provider_error" };

// Mints a meeting link for a scheduled time. The organizer's own account
// hosts the meeting, so the link inherits their provider settings.
export async function createConferencingMeeting({
  userId,
  provider,
  title,
  start,
  end,
  timeZone,
}: {
  userId: string;
  provider: ConferencingProvider;
  title: string;
  start: Date;
  end: Date;
  timeZone?: string | null;
}): Promise<CreateConferencingMeetingResult> {
  const connection = await getConferencingConnectionForProvider({
    userId,
    provider,
  });

  if (!connection) {
    return { ok: false, reason: "not_connected" };
  }

  const credential = await loadCredential(connection.credentialId);

  if (!credential) {
    return { ok: false, reason: "not_connected" };
  }

  try {
    switch (provider) {
      case "zoom": {
        const secret = await refreshZoomTokenIfExpired({ credential });
        const conferencing = await createZoomMeeting({
          accessToken: secret.accessToken,
          title,
          start,
          end,
          timeZone,
        });
        return { ok: true, conferencing };
      }
      case "meet": {
        const conferencing = await createMeetSpace(credential.secret);
        return { ok: true, conferencing };
      }
    }
  } catch (error) {
    // `err` is the key pino's default serializer expands; `error` logs as {}.
    logger.error(
      { err: error, userId, provider, connectionId: connection.id },
      "Failed to create conferencing meeting",
    );
    return { ok: false, reason: "provider_error" };
  }
}

async function refreshZoomTokenIfExpired({
  credential,
}: {
  credential: NonNullable<Awaited<ReturnType<typeof loadCredential>>>;
}): Promise<OAuthCredentials> {
  const expiresAt = credential.secret.expiresAt
    ? new Date(credential.secret.expiresAt)
    : credential.expiresAt;
  // Refresh a minute early so a token that expires mid-request is not used.
  const isFresh = expiresAt && expiresAt.getTime() - 60_000 > Date.now();

  if (isFresh || !credential.secret.refreshToken) {
    return credential.secret;
  }

  if (!env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET) {
    throw new Error("Zoom is not configured");
  }

  const client = new ZoomOAuthClient({
    clientId: env.ZOOM_CLIENT_ID,
    clientSecret: env.ZOOM_CLIENT_SECRET,
    scopes: credential.scopes,
  });

  const tokens = await client.refreshAccessToken(
    credential.secret.refreshToken,
  );

  // Zoom rotates the refresh token on every refresh; the old one is dead,
  // so the new pair is persisted before anything else can fail.
  await updateOAuthCredentialTokens({ id: credential.id, tokens });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt?.toISOString(),
    scopes: tokens.scopes,
  };
}
// Best effort: the tokens are already deleted locally, and a grant Zoom still
// holds is one the user can remove from their own Zoom app list.
export async function revokeZoomToken({
  credential,
}: {
  credential: NonNullable<Awaited<ReturnType<typeof loadCredential>>>;
}) {
  const { secret } = credential;
  if (!env.ZOOM_CLIENT_ID || !env.ZOOM_CLIENT_SECRET) {
    return;
  }

  const client = new ZoomOAuthClient({
    clientId: env.ZOOM_CLIENT_ID,
    clientSecret: env.ZOOM_CLIENT_SECRET,
    scopes: secret.scopes,
  });

  try {
    // Zoom rejects an expired access token, and they only live an hour, so
    // one that is stale, close to expiry or of unknown age is exchanged in
    // memory first, with the same margin refreshZoomTokenIfExpired uses.
    const expiresAt = secret.expiresAt
      ? new Date(secret.expiresAt)
      : credential.expiresAt;
    const isFresh = expiresAt && expiresAt.getTime() - 60_000 > Date.now();
    const accessToken =
      !isFresh && secret.refreshToken
        ? (await client.refreshAccessToken(secret.refreshToken)).accessToken
        : secret.accessToken;
    await client.revokeToken(accessToken);
  } catch (error) {
    logger.warn({ err: error }, "Failed to revoke Zoom token");
  }
}

async function createZoomMeeting({
  accessToken,
  title,
  start,
  end,
  timeZone,
}: {
  accessToken: string;
  title: string;
  start: Date;
  end: Date;
  timeZone?: string | null;
}): Promise<Conferencing> {
  const durationMinutes = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 60_000),
  );
  const res = await fetch("https://api.zoom.us/v2/users/me/meetings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic: title,
      type: 2, // scheduled meeting
      start_time: start.toISOString(),
      duration: durationMinutes,
      ...(timeZone ? { timezone: timeZone } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Zoom meeting creation failed with status ${res.status}: ${await res.text()}`,
    );
  }

  return zoomMeetingToConferencing(
    zoomMeetingResponseSchema.parse(await res.json()),
  );
}

async function createMeetSpace(
  credentials: OAuthCredentials,
): Promise<Conferencing> {
  const auth = new google.auth.OAuth2({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  });
  auth.setCredentials({
    access_token: credentials.accessToken,
    refresh_token: credentials.refreshToken,
  });

  const meet = google.meet({ version: "v2", auth });
  const { data } = await meet.spaces.create({ requestBody: {} });

  return meetSpaceToConferencing(meetSpaceResponseSchema.parse(data));
}
