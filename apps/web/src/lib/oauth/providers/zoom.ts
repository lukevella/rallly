import "server-only";

import { Zoom } from "arctic";
import * as z from "zod";
import type { OAuthClient, OAuthTokens, UserInfo } from "../types";
import { handleOAuthError } from "./base";

const zoomUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  display_name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
});

interface ZoomOAuthClientConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl?: string;
  scopes: string[];
  onConnect?: OAuthClient["onConnect"];
}

export class ZoomOAuthClient implements OAuthClient {
  provider = "zoom";
  private client: Zoom;
  scopes: string[];
  onConnect?: OAuthClient["onConnect"];

  constructor({
    clientId,
    clientSecret,
    scopes,
    callbackUrl = "",
    onConnect,
  }: ZoomOAuthClientConfig) {
    this.client = new Zoom(clientId, clientSecret, callbackUrl);
    this.scopes = scopes;
    this.onConnect = onConnect;
  }

  getAuthorizationUrl(state: string, codeVerifier: string): URL {
    return this.client.createAuthorizationURL(state, codeVerifier, this.scopes);
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
        scopes: tokens.hasScopes() ? tokens.scopes() : this.scopes,
      };
    } catch (error) {
      handleOAuthError(error);
    }
  }

  async getUserInfo(tokens: OAuthTokens): Promise<UserInfo> {
    try {
      const res = await fetch("https://api.zoom.us/v2/users/me", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      if (!res.ok) {
        throw new Error(`Zoom user lookup failed with status ${res.status}`);
      }
      const user = zoomUserSchema.parse(await res.json());
      const name =
        user.display_name ||
        [user.first_name, user.last_name].filter(Boolean).join(" ");
      return {
        id: user.id,
        email: user.email,
        name: name || undefined,
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
          : refreshToken,
        expiresAt: tokens.accessTokenExpiresAt(),
        scopes: tokens.hasScopes() ? tokens.scopes() : this.scopes,
      };
    } catch (error) {
      handleOAuthError(error);
    }
  }
}
