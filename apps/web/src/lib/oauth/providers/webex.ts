import "server-only";

import * as z from "zod";
import type { OAuth2ClientConfig } from "../oauth2";
import {
  createAuthorizationUrl,
  refreshAccessToken,
  validateAuthorizationCode,
} from "../oauth2";
import type { OAuthClient, OAuthTokens, UserInfo } from "../types";
import { handleOAuthError } from "./base";

const AUTHORIZATION_ENDPOINT = "https://webexapis.com/v1/authorize";
const TOKEN_ENDPOINT = "https://webexapis.com/v1/access_token";

const webexPersonSchema = z.object({
  id: z.string(),
  emails: z.array(z.string()).min(1),
  displayName: z.string().nullish(),
});

interface WebexOAuthClientConfig {
  clientId: string;
  clientSecret: string;
  callbackUrl?: string;
  scopes: string[];
  onConnect?: OAuthClient["onConnect"];
}

export class WebexOAuthClient implements OAuthClient {
  provider = "webex";
  private client: OAuth2ClientConfig;
  scopes: string[];
  onConnect?: OAuthClient["onConnect"];

  constructor({
    clientId,
    clientSecret,
    scopes,
    callbackUrl = "",
    onConnect,
  }: WebexOAuthClientConfig) {
    // Webex documents the client credentials in the form body only.
    this.client = {
      clientId,
      clientSecret,
      redirectUri: callbackUrl,
      authentication: "post",
    };
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
      const res = await fetch("https://webexapis.com/v1/people/me", {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        throw new Error(`Webex user lookup failed with status ${res.status}`);
      }
      const person = webexPersonSchema.parse(await res.json());
      return {
        id: person.id,
        email: person.emails[0],
        name: person.displayName || undefined,
      };
    } catch (error) {
      handleOAuthError(error);
    }
  }

  // Webex may or may not return a new refresh token; the stored one stays
  // valid until it is replaced or expires.
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
}
