export const INVALID_SESSION = "INVALID_SESSION";

/**
 * Thrown from SSR helpers when a session exists but the user is
 * missing from the database or banned. Next.js strips custom error
 * properties when serializing server errors to the client, but
 * preserves `digest`. We set it to a known constant so the client
 * error boundary can identify this error and revoke the session.
 * This is undocumented behavior and may break in a future version
 * of React/Next.js.
 */
export class InvalidSessionError extends Error {
  digest = INVALID_SESSION;

  constructor() {
    super("Invalid session");
  }
}
