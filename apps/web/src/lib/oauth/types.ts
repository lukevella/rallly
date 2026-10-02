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
  // For providers whose organizations can require an administrator to
  // approve the app before their users may connect it.
  getAdminConsentUrl?: (state: string) => URL;
}

export interface CreateOAuthOptions<T extends string> {
  basePath: string;
  getIntegration: ({
    integrationId,
    callbackUrl,
    flow,
  }: {
    integrationId: T;
    callbackUrl: string;
    // `admin_consent` runs for an administrator who may have no Rallly
    // session, so per user gates must not apply to it.
    flow: "connect" | "admin_consent";
  }) => OAuthClient | null | Promise<OAuthClient | null>;
  cookieConfig?: {
    prefix?: string;
    maxAge?: number;
    secure?: boolean;
    sameSite?: "strict" | "lax" | "none";
  };
}
