import { env } from "@/env";
import {
  createCalendarConnection,
  syncCalendars,
} from "@/features/calendars/mutations";
import {
  isConferencingEnabled,
  isConferencingProviderAllowedFor,
  MICROSOFT_TEAMS_SCOPES,
} from "@/features/conferencing/constants";
import { createConferencingConnection } from "@/features/conferencing/mutations";
import type { ConferencingProvider } from "@/features/conferencing/schema";
import { getMicrosoftTeamsAuthority } from "@/features/conferencing/utils";
import { saveOAuthCredentials } from "@/features/credentials/mutations";
import { getSession } from "@/lib/auth";
import { GoogleOAuthClient } from "@/lib/oauth/providers/google";
import { MicrosoftOAuthClient } from "@/lib/oauth/providers/microsoft";
import { ZoomOAuthClient } from "@/lib/oauth/providers/zoom";
import { OAuthIntegration } from "@/lib/oauth/server";
import type { OAuthClient } from "@/lib/oauth/types";

type Integration =
  | "google-calendar"
  | "outlook-calendar"
  | "google-meet"
  | "microsoft-teams"
  | "zoom";

async function requireSessionUserId() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("User not found");
  }
  return session.user.id;
}

async function isAllowedForSession(provider: ConferencingProvider) {
  const session = await getSession();
  return isConferencingProviderAllowedFor({
    provider,
    email: session?.user.email ?? null,
  });
}

function conferencingOnConnect({
  integrationId,
  displayName,
}: {
  integrationId: Integration;
  displayName: string;
}): NonNullable<OAuthClient["onConnect"]> {
  return async ({ provider, tokens, providerAccountId, userInfo }) => {
    const userId = await requireSessionUserId();

    const credential = await saveOAuthCredentials({
      userId,
      provider,
      providerAccountId,
      tokens,
    });

    await createConferencingConnection({
      userId,
      provider,
      integrationId,
      credentialId: credential.id,
      providerAccountId,
      userInfo,
      displayName,
    });
  };
}

const { handler } = OAuthIntegration<Integration>({
  basePath: "/api/integrations",
  getIntegration: async ({ integrationId, callbackUrl, flow }) => {
    switch (integrationId) {
      case "google-calendar": {
        if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
          return null;
        }
        return new GoogleOAuthClient({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackUrl,
          scopes: [
            "https://www.googleapis.com/auth/calendar.readonly",
            "https://www.googleapis.com/auth/calendar.events",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
          ],
          onConnect: async ({
            provider,
            tokens,
            providerAccountId,
            userInfo,
          }) => {
            const userId = await requireSessionUserId();

            // save credentials to database
            const credential = await saveOAuthCredentials({
              userId,
              provider,
              providerAccountId,
              tokens,
            });

            // create calendar connection
            const connection = await createCalendarConnection({
              userId,
              provider,
              integrationId,
              credentialId: credential.id,
              providerAccountId,
              userInfo,
              displayName: "Google Calendar",
            });

            await syncCalendars({ userId, connectionId: connection.id });
          },
        });
      }
      case "google-meet": {
        if (
          !isConferencingEnabled ||
          !env.GOOGLE_CLIENT_ID ||
          !env.GOOGLE_CLIENT_SECRET ||
          !(await isAllowedForSession("meet"))
        ) {
          return null;
        }
        return new GoogleOAuthClient({
          clientId: env.GOOGLE_CLIENT_ID,
          clientSecret: env.GOOGLE_CLIENT_SECRET,
          callbackUrl,
          scopes: [
            "https://www.googleapis.com/auth/meetings.space.created",
            "https://www.googleapis.com/auth/userinfo.email",
            "https://www.googleapis.com/auth/userinfo.profile",
          ],
          onConnect: conferencingOnConnect({
            integrationId,
            displayName: "Google Meet",
          }),
        });
      }
      case "zoom": {
        if (
          !isConferencingEnabled ||
          !env.ZOOM_CLIENT_ID ||
          !env.ZOOM_CLIENT_SECRET ||
          !(await isAllowedForSession("zoom"))
        ) {
          return null;
        }
        return new ZoomOAuthClient({
          clientId: env.ZOOM_CLIENT_ID,
          clientSecret: env.ZOOM_CLIENT_SECRET,
          callbackUrl,
          scopes: ["meeting:write:meeting", "user:read:user"],
          onConnect: conferencingOnConnect({
            integrationId,
            displayName: "Zoom",
          }),
        });
      }
      case "microsoft-teams": {
        if (
          !isConferencingEnabled ||
          !env.MICROSOFT_CLIENT_ID ||
          !env.MICROSOFT_CLIENT_SECRET ||
          // The rollout allowlist limits who connects. Approving the app for
          // an organization connects no one, and the administrator doing it
          // is rarely on the list or signed in to Rallly.
          (flow === "connect" && !(await isAllowedForSession("teams")))
        ) {
          return null;
        }
        return new MicrosoftOAuthClient({
          tenant: getMicrosoftTeamsAuthority(env.MICROSOFT_TENANT_ID),
          clientId: env.MICROSOFT_CLIENT_ID,
          clientSecret: env.MICROSOFT_CLIENT_SECRET,
          callbackUrl,
          scopes: MICROSOFT_TEAMS_SCOPES,
          onConnect: conferencingOnConnect({
            integrationId,
            displayName: "Microsoft Teams",
          }),
        });
      }
      default:
        return null;
    }
  },
});

export const GET = handler;
export const POST = handler;
