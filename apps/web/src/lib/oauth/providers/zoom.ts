import "server-only";

import * as z from "zod";
import type { OAuth2ClientConfig } from "../oauth2";
import {
  createAuthorizationUrl,
  refreshAccessToken,
  revokeToken,
  validateAuthorizationCode,
} from "../oauth2";
import type { OAuthClient, OAuthTokens, UserInfo } from "../types";
import { handleOAuthError } from "./base";

const AUTHORIZATION_ENDPOINT = "https://zoom.us/oauth/authorize";
const TOKEN_ENDPOINT = "https://zoom.us/oauth/token";
const REVOCATION_ENDPOINT = "https://zoom.us/oauth/revoke";

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
  private client: OAuth2ClientConfig;
  scopes: string[];
  onConnect?: OAuthClient["onConnect"];

  constructor({
    clientId,
    clientSecret,
    scopes,
    callbackUrl = "",
    onConnect,
  }: ZoomOAuthClientConfig) {
    this.client = { clientId, clientSecret, redirectUri: callbackUrl };
    this.scopes = scopes;
    this.onConnect = onConnect;
  }

  getAuthorizationUrl(state: string, codeVerifier: string): URL {
    return createAuthorizationUrl({
      endpoint: AUTHORIZATION_ENDPOINT,
      client: this.client,
      state,
      codeVerifier,
      scopes: this.scopes,
    });
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
      const tokens = await refreshAccessToken({
        endpoint: TOKEN_ENDPOINT,
        client: this.client,
        refreshToken,
      });
      return {
        ...tokens,
        refreshToken: tokens.refreshToken ?? refreshToken,
        scopes: tokens.scopes ?? this.scopes,
      };
    } catch (error) {
      handleOAuthError(error);
    }
  }

  async revokeToken(accessToken: string): Promise<void> {
    try {
      await revokeToken({
        endpoint: REVOCATION_ENDPOINT,
        client: this.client,
        token: accessToken,
      });
    } catch (error) {
      handleOAuthError(error);
    }
  }
}
