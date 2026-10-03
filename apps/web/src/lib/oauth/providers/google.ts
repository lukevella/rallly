import "server-only";

import { google } from "googleapis";
import type { OAuth2ClientConfig } from "../oauth2";
import {
  createAuthorizationUrl,
  refreshAccessToken,
  validateAuthorizationCode,
} from "../oauth2";
import type { OAuthClient, OAuthTokens, UserInfo } from "../types";
import { handleOAuthError } from "./base";

const AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

interface GoogleOAuthClientConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl?: string;
  scopes: string[];
  onConnect?: (params: {
    providerAccountId: string;
    userInfo: UserInfo;
    provider: string;
    tokens: OAuthTokens;
  }) => Promise<void>;
}

export class GoogleOAuthClient implements OAuthClient {
  provider = "google";
  private client: OAuth2ClientConfig;
  private clientId: string;
  private clientSecret: string;
  scopes: string[];
  onConnect?: (params: {
    providerAccountId: string;
    userInfo: UserInfo;
    provider: string;
    tokens: OAuthTokens;
  }) => Promise<void>;
  constructor({
    clientId,
    clientSecret,
    scopes,
    callbackUrl = "",
    onConnect,
  }: GoogleOAuthClientConfig) {
    this.client = { clientId, clientSecret, redirectUri: callbackUrl };
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.onConnect = onConnect;
  }

  getAuthorizationUrl(state: string, codeVerifier: string): URL {
    const authUrl = createAuthorizationUrl({
      endpoint: AUTHORIZATION_ENDPOINT,
      client: this.client,
      state,
      codeVerifier,
      scopes: this.scopes,
    });

    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    // Calendar and Meet share one credential row per Google account, so a
    // later consent must return a token carrying every scope granted so far
    // rather than replacing them with only the newly requested ones.
    authUrl.searchParams.set("include_granted_scopes", "true");

    return authUrl;
  }

  async exchangeCode(code: string, codeVerifier: string): Promise<OAuthTokens> {
    try {
      const tokens = await validateAuthorizationCode({
        endpoint: TOKEN_ENDPOINT,
        client: this.client,
        code,
        codeVerifier,
      });

      return { ...tokens, scopes: tokens.scopes ?? this.scopes };
    } catch (error) {
      handleOAuthError(error);
    }
  }

  async getUserInfo(tokens: OAuthTokens): Promise<UserInfo> {
    try {
      const oauth2Client = new google.auth.OAuth2({
        clientId: this.clientId,
        clientSecret: this.clientSecret,
      });
      oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      if (!userInfo.id || !userInfo.email) {
        throw new Error("Missing required user information from Google");
      }

      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name || undefined,
      };
    } catch (error) {
      handleOAuthError(error);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      const tokens = await refreshAccessToken({
        endpoint: TOKEN_ENDPOINT,
        client: this.client,
        refreshToken,
      });

      return { ...tokens, scopes: tokens.scopes ?? this.scopes };
    } catch (error) {
      handleOAuthError(error);
    }
  }
}
