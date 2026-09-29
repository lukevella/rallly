import "server-only";

import { createLogger } from "@rallly/logger";
import { OAuth2RequestError } from "arctic";
import { google } from "googleapis";
import { env } from "@/env";
import { loadCredential } from "@/features/credentials/data";
import { updateOAuthCredentialTokens } from "@/features/credentials/mutations";
import type { OAuthCredentials } from "@/features/credentials/schema";
import { MicrosoftOAuthClient } from "@/lib/oauth/providers/microsoft";
import { ZoomOAuthClient } from "@/lib/oauth/providers/zoom";
import { MICROSOFT_TEAMS_SCOPES } from "./constants";
import { getConferencingConnectionForProvider } from "./data";
import type { Conferencing, ConferencingProvider } from "./schema";
import {
  getMicrosoftTeamsAuthority,
  isTeamsMeetingRefusal,
  meetSpaceResponseSchema,
  meetSpaceToConferencing,
  teamsMeetingProbeResponseSchema,
  teamsMeetingResponseSchema,
  teamsMeetingToConferencing,
  zoomMeetingResponseSchema,
  zoomMeetingToConferencing,
} from "./utils";

const logger = createLogger("conferencing/service");

export type CreateConferencingMeetingResult =
  | { ok: true; conferencing: Conferencing }
  | {
      ok: false;
      reason: "not_connected" | "cannot_host" | "provider_error";
    };

// Microsoft refused the request itself, which reconnecting does not fix: the
// account has no Teams license, never opened Teams, or a policy blocks it.
class TeamsMeetingRefusedError extends Error {
  status: number;
  constructor({ status, body }: { status: number; body: string }) {
    super(`Teams meeting creation refused with status ${status}: ${body}`);
    this.name = "TeamsMeetingRefusedError";
    this.status = status;
  }
}

const TEAMS_ONLINE_MEETINGS_URL =
  "https://graph.microsoft.com/v1.0/me/onlineMeetings";

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
      case "teams": {
        const secret = await refreshMicrosoftTokenIfExpired({ credential });
        const conferencing = await createTeamsMeeting({
          accessToken: secret.accessToken,
          title,
          start,
          end,
        });
        return { ok: true, conferencing };
      }
    }
  } catch (error) {
    // The grant is gone (expired after inactivity, password change, revoked
    // by the user or their admin); only reconnecting brings it back.
    if (error instanceof OAuth2RequestError && error.code === "invalid_grant") {
      logger.warn(
        { userId, provider, connectionId: connection.id },
        "Conferencing grant is no longer valid",
      );
      return { ok: false, reason: "not_connected" };
    }
    if (error instanceof TeamsMeetingRefusedError) {
      logger.warn(
        { err: error, userId, provider, connectionId: connection.id },
        "Microsoft account cannot host Teams meetings",
      );
      return { ok: false, reason: "cannot_host" };
    }
    // `err` is the key pino's default serializer expands; `error` logs as {}.
    logger.error(
      { err: error, userId, provider, connectionId: connection.id },
      "Failed to create conferencing meeting",
    );
    return { ok: false, reason: "provider_error" };
  }
}

type StoredCredential = NonNullable<Awaited<ReturnType<typeof loadCredential>>>;

// Checked a minute early so a token that expires mid-request is not used.
function isAccessTokenFresh(credential: StoredCredential) {
  const expiresAt = credential.secret.expiresAt
    ? new Date(credential.secret.expiresAt)
    : credential.expiresAt;
  return Boolean(expiresAt && expiresAt.getTime() - 60_000 > Date.now());
}

async function refreshZoomTokenIfExpired({
  credential,
}: {
  credential: StoredCredential;
}): Promise<OAuthCredentials> {
  if (isAccessTokenFresh(credential) || !credential.secret.refreshToken) {
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

async function refreshMicrosoftTokenIfExpired({
  credential,
}: {
  credential: StoredCredential;
}): Promise<OAuthCredentials> {
  if (isAccessTokenFresh(credential) || !credential.secret.refreshToken) {
    return credential.secret;
  }

  if (!env.MICROSOFT_CLIENT_ID || !env.MICROSOFT_CLIENT_SECRET) {
    throw new Error("Microsoft is not configured");
  }

  const client = new MicrosoftOAuthClient({
    tenant: getMicrosoftTeamsAuthority(env.MICROSOFT_TENANT_ID),
    clientId: env.MICROSOFT_CLIENT_ID,
    clientSecret: env.MICROSOFT_CLIENT_SECRET,
    scopes: MICROSOFT_TEAMS_SCOPES,
  });

  const tokens = await client.refreshAccessToken(
    credential.secret.refreshToken,
  );

  // Every refresh returns a new refresh token; persist it before the meeting
  // call so a failure there does not leave the stored one behind.
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
  credential: StoredCredential;
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
    const accessToken =
      !isAccessTokenFresh(credential) && secret.refreshToken
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

// Graph does not add the meeting to the organizer's Outlook calendar; the
// event's own invite carries it.
async function createTeamsMeeting({
  accessToken,
  title,
  start,
  end,
}: {
  accessToken: string;
  title: string;
  start: Date;
  end: Date;
}): Promise<Conferencing> {
  const res = await fetch(TEAMS_ONLINE_MEETINGS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject: title,
      startDateTime: start.toISOString(),
      endDateTime: end.toISOString(),
    }),
  });

  if (!res.ok) {
    // Read for the log only; the status decides which error this is.
    const body = await res.text().catch(() => "");
    if (isTeamsMeetingRefusal(res.status)) {
      throw new TeamsMeetingRefusedError({ status: res.status, body });
    }
    throw new Error(
      `Teams meeting creation failed with status ${res.status}: ${body}`,
    );
  }

  return teamsMeetingToConferencing(
    teamsMeetingResponseSchema.parse(await res.json()),
  );
}

export type TeamsHostCheckResult =
  | { ok: true }
  | { ok: false; reason: "refused" | "inconclusive" };

// The check runs inside the OAuth callback, so a request Microsoft never
// answers must not hold the connection open.
const TEAMS_CHECK_CREATE_TIMEOUT_MS = 10_000;
const TEAMS_CHECK_DELETE_TIMEOUT_MS = 5_000;

// Proves at connect time that the account can host meetings, by creating one
// and deleting it again, so a missing Teams license surfaces while the user
// is looking at the connection rather than when they finalize a poll. Graph
// meetings are never written to a calendar, so the user sees nothing. Only a
// refusal blocks the connection; an outage, a timeout or a throttle must not.
export async function checkTeamsCanHostMeetings({
  accessToken,
}: {
  accessToken: string;
}): Promise<TeamsHostCheckResult> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  let meetingId: string;
  try {
    const start = new Date(Date.now() + 60 * 60_000);
    const end = new Date(start.getTime() + 30 * 60_000);
    const res = await fetch(TEAMS_ONLINE_MEETINGS_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        subject: "Rallly connection check",
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
      }),
      signal: AbortSignal.timeout(TEAMS_CHECK_CREATE_TIMEOUT_MS),
    });

    if (!res.ok) {
      // The status alone decides; the body is only read for the log, and a
      // read that fails must not turn a refusal into an inconclusive check.
      const refused = isTeamsMeetingRefusal(res.status);
      const body = await res.text().catch(() => undefined);
      logger.warn(
        { status: res.status, body, refused },
        "Teams connection check did not create a meeting",
      );
      return { ok: false, reason: refused ? "refused" : "inconclusive" };
    }

    meetingId = teamsMeetingProbeResponseSchema.parse(await res.json()).id;
  } catch (error) {
    logger.warn({ err: error }, "Teams connection check failed to run");
    return { ok: false, reason: "inconclusive" };
  }

  // The account has proven it can host. Whether the test meeting could be
  // removed is a separate matter and never changes that answer.
  await deleteTeamsCheckMeeting({ meetingId, headers });
  return { ok: true };
}

// Tried twice, since a failure here is usually transient. A meeting that
// stays behind is on no calendar and expires on Microsoft's side; its id is
// logged so it can be removed by hand.
async function deleteTeamsCheckMeeting({
  meetingId,
  headers,
}: {
  meetingId: string;
  headers: Record<string, string>;
}) {
  let failure: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(
        `${TEAMS_ONLINE_MEETINGS_URL}/${encodeURIComponent(meetingId)}`,
        {
          method: "DELETE",
          headers,
          signal: AbortSignal.timeout(TEAMS_CHECK_DELETE_TIMEOUT_MS),
        },
      );
      // Already gone is as good as deleted.
      if (res.ok || res.status === 404) {
        return;
      }
      failure = new Error(`Delete answered with status ${res.status}`);
    } catch (error) {
      failure = error;
    }
  }
  logger.warn(
    { err: failure, meetingId },
    "Teams connection check meeting was left behind",
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
