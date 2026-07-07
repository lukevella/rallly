export const INVALID_SESSION = "INVALID_SESSION";

/**
 * Domain error thrown when a session references a user that is missing
 * from the database or banned. Each transport adapts it to its own
 * protocol: server actions revoke the session in handleServerError,
 * route handlers map it to an error response. Server components can't
 * write cookies, so the client error boundary revokes the session
 * instead — Next.js strips custom error properties when serializing
 * server errors but preserves `digest`, which we set to a known
 * constant so the boundary can identify this error. The digest
 * behavior is undocumented and may break in a future version of
 * React/Next.js.
 */
export class InvalidSessionError extends Error {
  digest = INVALID_SESSION;

  constructor() {
    super("Invalid session");
    this.name = "InvalidSessionError";
  }
}
