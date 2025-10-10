import "server-only";

import type { Auth } from "googleapis";
import { google } from "googleapis";
import { env } from "@/env";

export type GoogleServiceParams = {
  credentials: {
    accessToken: string;
    refreshToken?: string;
  };
};

export class GoogleService {
  oauth2Client: Auth.OAuth2Client;

  constructor(private readonly params: GoogleServiceParams) {
    this.oauth2Client = new google.auth.OAuth2({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    });

    this.oauth2Client.setCredentials({
      access_token: params.credentials.accessToken,
      refresh_token: params.credentials.refreshToken,
    });
  }
}
