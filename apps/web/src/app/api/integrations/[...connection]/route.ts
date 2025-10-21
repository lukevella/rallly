import { env } from "@/env";
import {
  createCalendarConnection,
  syncCalendars,
} from "@/features/calendars/mutations";
import { saveOAuthCredentials } from "@/features/credentials/mutations";
import { getSession } from "@/lib/auth";
import { GoogleOAuthClient } from "@/lib/oauth/providers/google";
import { OAuthIntegration } from "@/lib/oauth/server";

type Integration = "google-calendar" | "outlook-calendar";

const { handler } = OAuthIntegration<Integration>({
  baseUrl: "/api/integrations",
  getIntegration: ({ integrationId, callbackUrl }) => {
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
            const session = await getSession();
            if (!session?.user) {
              throw new Error("User not found");
            }

            const userId = session.user.id;

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
      default:
        return null;
    }
  },
});

export const GET = handler;
export const POST = handler;
