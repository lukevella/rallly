export const INVALID_SESSION_DIGEST = "INVALID_SESSION";

export class InvalidSessionError extends Error {
  digest = INVALID_SESSION_DIGEST;

  constructor() {
    super("Invalid session");
  }
}
