// An error response (RFC 6749 section 5.2) from a token or revocation
// endpoint. `invalid_grant` means the refresh token is dead and only
// reconnecting brings the grant back.
export class OAuth2RequestError extends Error {
  code: string;
  description?: string;
  constructor(code: string, description?: string) {
    super(`OAuth request error: ${code}`);
    this.name = "OAuth2RequestError";
    this.code = code;
    this.description = description;
  }
}

// Thrown from `onConnect` to refuse a connection for a reason the landing page
// can explain. The reason travels in the outcome flash, whose fields are
// colon separated, so it is limited to lowercase words and underscores.
export class OAuthConnectionRefusedError extends Error {
  reason: string;
  constructor(reason: string) {
    super(`OAuth connection refused: ${reason}`);
    this.name = "OAuthConnectionRefusedError";
    this.reason = /^[a-z_]+$/.test(reason) ? reason : "connection_failed";
  }
}
