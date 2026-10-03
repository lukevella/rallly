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

const microsoftUserSchema = z.object({
  id: z.string(),
  mail: z.string().nullish(),
  userPrincipalName: z.string().nullish(),
  displayName: z.string().nullish(),
});

interface MicrosoftOAuthClientConfig {
  tenant: string;
  clientId: string;
  clientSecret: string;
  callbackUrl?: string;
  scopes: string[];
  onConnect?: OAuthClient["onConnect"];
}

export class MicrosoftOAuthClient implements OAuthClient {
  provider = "microsoft";
  private client: OAuth2ClientConfig;
  private tenant: string;
  private clientId: string;
  private callbackUrl: string;
  scopes: string[];
  onConnect?: OAuthClient["onConnect"];

  constructor({
    tenant,
    clientId,
    clientSecret,
    scopes,
    callbackUrl = "",
    onConnect,
  }: MicrosoftOAuthClientConfig) {
    this.client = { clientId, clientSecret, redirectUri: callbackUrl };
    this.tenant = tenant;
    this.clientId = clientId;
    this.callbackUrl = callbackUrl;
    this.scopes = scopes;
    this.onConnect = onConnect;
  }

  getAuthorizationUrl(state: string, codeVerifier: string): URL {
    const url = createAuthorizationUrl({
      endpoint: `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/authorize`,
      client: this.client,
      state,
      codeVerifier,
      scopes: this.scopes,
    });
    // Without it Microsoft silently reuses whichever account the browser is
    // signed in to, which is often not the one that holds the Teams license.
    url.searchParams.set("prompt", "select_account");
    return url;
  }

  private get tokenEndpoint() {
    return `https://login.microsoftonline.com/${this.tenant}/oauth2/v2.0/token`;
  }

  // Tenant wide consent for organizations that do not let users consent to
  // apps themselves. Microsoft returns the admin to the callback with
  // `admin_consent` set instead of a code.
  getAdminConsentUrl(state: string): URL {
    const url = new URL(
      `https://login.microsoftonline.com/${this.tenant}/adminconsent`,
    );
    url.searchParams.set("client_id", this.clientId);
    url.searchParams.set("redirect_uri", this.callbackUrl);
    url.searchParams.set("state", state);
    return url;
  }

  async exchangeCode(code: string, codeVerifier: string): Promise<OAuthTokens> {
    try {
      const tokens = await validateAuthorizationCode({
        endpoint: this.tokenEndpoint,
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
      const res = await fetch(
        "https://graph.microsoft.com/v1.0/me?$select=id,mail,userPrincipalName,displayName",
        { headers: { Authorization: `Bearer ${tokens.accessToken}` } },
      );
      if (!res.ok) {
        throw new Error(
          `Microsoft user lookup failed with status ${res.status}`,
        );
      }
      const user = microsoftUserSchema.parse(await res.json());
      // `mail` is empty for accounts without an Exchange mailbox; the UPN is
      // the address they sign in with.
      const email = user.mail || user.userPrincipalName;
      if (!email) {
        throw new Error("Missing required user information from Microsoft");
      }
      return {
        id: user.id,
        email,
        name: user.displayName || undefined,
      };
    } catch (error) {
      handleOAuthError(error);
    }
  }

  // Microsoft rotates the refresh token on every refresh, and a refresh token
  // is not bound to a scope, so the scopes are named again on each call.
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    try {
      const tokens = await refreshAccessToken({
        endpoint: this.tokenEndpoint,
        client: this.client,
        refreshToken,
        scopes: this.scopes,
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
