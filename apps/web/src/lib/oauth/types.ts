export type IntegrationCategory = "calendar" | "conferencing";

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
}

export interface UserInfo {
  id: string;
  email: string;
  name?: string;
}

/**
 * Base OAuth connection with required fields
 * Extend this for specific integration types
 */
export interface OAuthConnection {
  id: string;
  userId: string;
  provider: string;
  providerAccountId: string;
  email: string;
  displayName?: string;
  status: string;
  lastSyncedAt?: Date;
  syncErrors: number;
  settings?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OAuthClient {
  provider: string;
  onConnect?: (params: {
    providerAccountId: string;
    userInfo: UserInfo;
    provider: string;
    tokens: OAuthTokens;
  }) => Promise<void>;
  getAuthorizationUrl: (state: string, codeVerifier: string) => URL;
  exchangeCode: (code: string, codeVerifier: string) => Promise<OAuthTokens>;
  getUserInfo: (tokens: OAuthTokens) => Promise<UserInfo>;
  refreshAccessToken: (refreshToken: string) => Promise<OAuthTokens>;
}

export interface CreateOAuthOptions<T extends string> {
  baseUrl: string;
  getIntegration: ({
    integrationId,
    callbackUrl,
  }: {
    integrationId: T;
    callbackUrl: string;
  }) => OAuthClient | null;
  cookieConfig?: {
    prefix?: string;
    maxAge?: number;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  };
}
