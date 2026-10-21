// The DSN is public (it ships in the browser bundle). Only this project is
// forwarded so the tunnel can't be used as an open relay into Sentry.
const SENTRY_HOST = "o1147190.ingest.sentry.io";
const SENTRY_PROJECT_ID = "6217117";

const NEWLINE = 10;

/**
 * Returns the Sentry ingest URL for an envelope addressed to the allowed
 * project, or null for anything else. The envelope header (the first line)
 * carries the DSN whenever the SDK is configured with a tunnel. Later items
 * may be binary (replay segments), so only the header is decoded.
 */
export function resolveUpstream(envelope: Uint8Array) {
  const newline = envelope.indexOf(NEWLINE);
  const headerBytes = newline === -1 ? envelope : envelope.subarray(0, newline);

  let header: unknown;
  try {
    header = JSON.parse(new TextDecoder().decode(headerBytes));
  } catch {
    return null;
  }

  if (
    typeof header !== "object" ||
    header === null ||
    !("dsn" in header) ||
    typeof header.dsn !== "string"
  ) {
    return null;
  }

  let dsn: URL;
  try {
    dsn = new URL(header.dsn);
  } catch {
    return null;
  }

  const projectId = dsn.pathname.replace(/^\//, "");
  if (dsn.hostname !== SENTRY_HOST || projectId !== SENTRY_PROJECT_ID) {
    return null;
  }

  return `https://${SENTRY_HOST}/api/${SENTRY_PROJECT_ID}/envelope/`;
}
