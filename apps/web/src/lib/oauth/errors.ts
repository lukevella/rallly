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
