import { afterEach, describe, expect, it, vi } from "vitest";
import { OAuth2RequestError } from "./errors";
import {
  createAuthorizationUrl,
  createS256CodeChallenge,
  generateCodeVerifier,
  refreshAccessToken,
  validateAuthorizationCode,
} from "./oauth2";

const client = {
  clientId: "client",
  clientSecret: "secret",
  redirectUri: "https://example.com/callback",
};

const stubFetch = (status: number, body: unknown) => {
  const fetchMock = vi.fn(async () => Response.json(body, { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createS256CodeChallenge", () => {
  it("matches the RFC 7636 appendix B example", () => {
    expect(
      createS256CodeChallenge("dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"),
    ).toBe("E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM");
  });
});

describe("generateCodeVerifier", () => {
  it("produces a verifier within the RFC 7636 length and alphabet", () => {
    expect(generateCodeVerifier()).toMatch(/^[A-Za-z0-9_-]{43,128}$/);
  });
});

describe("createAuthorizationUrl", () => {
  it("sets the PKCE authorization request parameters", () => {
    const url = createAuthorizationUrl({
      endpoint: "https://provider.example/authorize",
      client,
      state: "state",
      codeVerifier: "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
      scopes: ["a", "b"],
    });

    expect(Object.fromEntries(url.searchParams)).toEqual({
      response_type: "code",
      client_id: "client",
      redirect_uri: "https://example.com/callback",
      state: "state",
      code_challenge_method: "S256",
      code_challenge: "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
      scope: "a b",
    });
  });
});

describe("validateAuthorizationCode", () => {
  it("authenticates with Basic credentials and maps the token response", async () => {
    const fetchMock = stubFetch(200, {
      access_token: "access",
      refresh_token: "refresh",
      expires_in: 3600,
      scope: "a b",
    });

    const tokens = await validateAuthorizationCode({
      endpoint: "https://provider.example/token",
      client,
      code: "code",
      codeVerifier: "verifier",
    });

    expect(tokens).toMatchObject({
      accessToken: "access",
      refreshToken: "refresh",
      scopes: ["a", "b"],
    });
    expect(tokens.expiresAt).toBeInstanceOf(Date);

    const [, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(new Headers(init.headers).get("Authorization")).toBe(
      `Basic ${btoa("client:secret")}`,
    );
    expect(Object.fromEntries(init.body as URLSearchParams)).toEqual({
      grant_type: "authorization_code",
      code: "code",
      redirect_uri: "https://example.com/callback",
      code_verifier: "verifier",
    });
  });

  it("leaves optional fields undefined when the provider omits them", async () => {
    stubFetch(200, { access_token: "access" });

    const tokens = await validateAuthorizationCode({
      endpoint: "https://provider.example/token",
      client,
      code: "code",
      codeVerifier: "verifier",
    });

    expect(tokens).toEqual({
      accessToken: "access",
      refreshToken: undefined,
      expiresAt: undefined,
      scopes: undefined,
    });
  });
});

describe("refreshAccessToken", () => {
  it("raises an OAuth2RequestError carrying the provider's error code", async () => {
    stubFetch(400, {
      error: "invalid_grant",
      error_description: "Token has been expired or revoked.",
    });

    const promise = refreshAccessToken({
      endpoint: "https://provider.example/token",
      client,
      refreshToken: "refresh",
    });

    await expect(promise).rejects.toBeInstanceOf(OAuth2RequestError);
    await expect(promise).rejects.toMatchObject({ code: "invalid_grant" });
  });

  it("raises a plain error when the failure carries no OAuth error body", async () => {
    stubFetch(502, "Bad gateway");

    const promise = refreshAccessToken({
      endpoint: "https://provider.example/token",
      client,
      refreshToken: "refresh",
    });

    await expect(promise).rejects.not.toBeInstanceOf(OAuth2RequestError);
    await expect(promise).rejects.toThrow("(502)");
  });
});
