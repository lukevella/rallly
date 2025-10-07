import "server-only";

import { Google } from "arctic";
import { google } from "googleapis";
import type { OAuthClient, OAuthTokens, UserInfo } from "../types";
import { handleOAuthError } from "./base";

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
  private client: Google;
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
    this.client = new Google(clientId, clientSecret, callbackUrl);
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.scopes = scopes;
    this.onConnect = onConnect;
  }

  getAuthorizationUrl(state: string, codeVerifier: string): URL {
    const authUrl = this.client.createAuthorizationURL(
      state,
      codeVerifier,
      this.scopes,
    );

    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");

    return authUrl;
  }

  async exchangeCode(code: string, codeVerifier: string): Promise<OAuthTokens> {
    try {
      const tokens = await this.client.validateAuthorizationCode(
        code,
        codeVerifier,
      );

      return {
        accessToken: tokens.accessToken(),
        refreshToken: tokens.hasRefreshToken()
          ? tokens.refreshToken()
          : undefined,
        expiresAt: tokens.accessTokenExpiresAt(),
        scopes: tokens.scopes(),
      };
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
      const tokens = await this.client.refreshAccessToken(refreshToken);

      return {
        accessToken: tokens.accessToken(),
        refreshToken: tokens.hasRefreshToken()
          ? tokens.refreshToken()
          : undefined,
        expiresAt: tokens.accessTokenExpiresAt(),
        scopes: tokens.scopes(),
      };
    } catch (error) {
      handleOAuthError(error);
    }
  }
}
