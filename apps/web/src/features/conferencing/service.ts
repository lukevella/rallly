import "server-only";

import { createLogger } from "@rallly/logger";
import { google } from "googleapis";
import { env } from "@/env";
import { loadCredential } from "@/features/credentials/data";
import { saveOAuthCredentials } from "@/features/credentials/mutations";
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
        const secret = await refreshZoomTokenIfExpired({
          userId,
          credential,
        });
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
  userId,
  credential,
}: {
  userId: string;
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

  // Zoom rotates the refresh token on every refresh; the old one is dead.
  await saveOAuthCredentials({
    userId,
    provider: credential.provider,
    providerAccountId: await zoomAccountId(tokens.accessToken),
    tokens,
  });

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt?.toISOString(),
    scopes: tokens.scopes,
  };
}

async function zoomAccountId(accessToken: string) {
  const res = await fetch("https://api.zoom.us/v2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Zoom user lookup failed with status ${res.status}`);
  }
  const { id } = (await res.json()) as { id: string };
  return id;
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
