import { env } from "@/env";
import {
  createCalendarConnection,
  syncCalendars,
} from "@/features/calendars/mutations";
import {
  isConferencingEnabled,
  isZoomAllowedFor,
} from "@/features/conferencing/constants";
import { createConferencingConnection } from "@/features/conferencing/mutations";
import { saveOAuthCredentials } from "@/features/credentials/mutations";
import { getSession } from "@/lib/auth";
import { GoogleOAuthClient } from "@/lib/oauth/providers/google";
import { ZoomOAuthClient } from "@/lib/oauth/providers/zoom";
import { OAuthIntegration } from "@/lib/oauth/server";
import type { OAuthClient } from "@/lib/oauth/types";

type Integration =
  | "google-calendar"
  | "outlook-calendar"
  | "google-meet"
  | "zoom";

async function requireSessionUserId() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error("User not found");
  }
  return session.user.id;
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
  getIntegration: async ({ integrationId, callbackUrl }) => {
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
          !env.GOOGLE_CLIENT_SECRET
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
          !env.ZOOM_CLIENT_SECRET
        ) {
          return null;
        }
        const session = await getSession();
        if (!isZoomAllowedFor(session?.user.email ?? null)) {
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
      default:
        return null;
    }
  },
});

export const GET = handler;
export const POST = handler;
