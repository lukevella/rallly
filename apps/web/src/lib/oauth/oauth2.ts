import "server-only";

import { createHash, randomBytes } from "node:crypto";
import * as z from "zod";
import { OAuth2RequestError } from "./errors";

// The authorization code grant with PKCE (RFC 6749, RFC 7636) for a
// confidential client, which authenticates to the token endpoint with HTTP
// Basic credentials. Every provider we integrate with accepts this shape.

export interface OAuth2ClientConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface OAuth2TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes?: string[];
}

const tokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().nullish(),
  expires_in: z.number().nullish(),
  scope: z.string().nullish(),
});

const errorResponseSchema = z.object({
  error: z.string(),
  error_description: z.string().nullish(),
});

const randomToken = () => randomBytes(32).toString("base64url");

export const generateState = randomToken;

export const generateCodeVerifier = randomToken;

export function createS256CodeChallenge(codeVerifier: string) {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function createAuthorizationUrl({
  endpoint,
  client,
  state,
  codeVerifier,
  scopes,
}: {
  endpoint: string;
  client: OAuth2ClientConfig;
  state: string;
  codeVerifier: string;
  scopes: string[];
}) {
  const url = new URL(endpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", client.clientId);
  url.searchParams.set("redirect_uri", client.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("code_challenge", createS256CodeChallenge(codeVerifier));
  if (scopes.length > 0) {
    url.searchParams.set("scope", scopes.join(" "));
  }
  return url;
}

export async function validateAuthorizationCode({
  endpoint,
  client,
  code,
  codeVerifier,
}: {
  endpoint: string;
  client: OAuth2ClientConfig;
  code: string;
  codeVerifier: string;
}) {
  const response = await postForm({
    endpoint,
    client,
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: client.redirectUri,
      code_verifier: codeVerifier,
    }),
  });
  return parseTokenResponse(response);
}

export async function refreshAccessToken({
  endpoint,
  client,
  refreshToken,
  scopes = [],
}: {
  endpoint: string;
  client: OAuth2ClientConfig;
  refreshToken: string;
  scopes?: string[];
}) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  if (scopes.length > 0) {
    body.set("scope", scopes.join(" "));
  }
  const response = await postForm({ endpoint, client, body });
  return parseTokenResponse(response);
}

export async function revokeToken({
  endpoint,
  client,
  token,
}: {
  endpoint: string;
  client: OAuth2ClientConfig;
  token: string;
}) {
  const response = await postForm({
    endpoint,
    client,
    body: new URLSearchParams({ token }),
  });
  await response.body?.cancel();
}

async function postForm({
  endpoint,
  client,
  body,
}: {
  endpoint: string;
  client: OAuth2ClientConfig;
  body: URLSearchParams;
}) {
  const credentials = Buffer.from(
    `${client.clientId}:${client.clientSecret}`,
  ).toString("base64");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    },
    body,
  });

  if (response.ok) {
    return response;
  }

  const error = errorResponseSchema.safeParse(
    await response.json().catch(() => null),
  );
  if (error.success) {
    throw new OAuth2RequestError(
      error.data.error,
      error.data.error_description ?? undefined,
    );
  }
  throw new Error(`OAuth request to ${endpoint} failed (${response.status})`);
}

async function parseTokenResponse(
  response: Response,
): Promise<OAuth2TokenResponse> {
  const data = tokenResponseSchema.parse(await response.json());
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? undefined,
    expiresAt:
      data.expires_in != null
        ? new Date(Date.now() + data.expires_in * 1000)
        : undefined,
    scopes: data.scope?.split(" ").filter(Boolean),
  };
}
