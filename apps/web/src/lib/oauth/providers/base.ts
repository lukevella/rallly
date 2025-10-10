import type { OAuthTokens, UserInfo } from "@/lib/oauth/types";

/**
 * Creates a standard OAuth error
 */
export function OAuthError(
  message: string,
  code?: string,
  details?: unknown,
): Error {
  const error = new Error(message) as Error & {
    code?: string;
    details?: unknown;
  };
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Handles OAuth errors consistently
 */
export function handleOAuthError(error: unknown): never {
  if (error instanceof Error) {
    throw error;
  }

  if (typeof error === "object" && error !== null) {
    // biome-ignore lint/suspicious/noExplicitAny: temporary - we will rewrite this with better error handling or perhaps even use effect ts
    const err = error as any;
    throw OAuthError(
      err.message || err.error_description || "OAuth operation failed",
      err.error || "OAUTH_ERROR",
      error,
    );
  }

  throw OAuthError("Unknown OAuth error", "UNKNOWN_ERROR", error);
}

export interface OAuthService {
  provider: string;
  scopes: string[];
  onConnect?: (params: {
    providerAccountId: string;
    userInfo: UserInfo;
    provider: string;
    tokens: OAuthTokens;
  }) => Promise<void>;
  getAuthorizationUrl(state: string, codeVerifier: string): URL;
  exchangeCode(code: string, codeVerifier: string): Promise<OAuthTokens>;
}
