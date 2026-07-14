import { app } from "../../v1/[...route]/route";

/**
 * Temporary alias: the API moved from /api/private to /api/v1 (RAL-1261).
 * Keeps existing beta integrations working during the deprecation window
 * (~60 days after launch). Remove by deleting this directory.
 *
 * A next.config rewrite can't do this — route handlers receive the original
 * request URL, so Hono (basePath /api/v1) would not match the rewritten
 * request. Instead we normalize the path here and hand the request to the
 * same Hono app.
 */
const handleLegacyPath = (request: Request) => {
  const url = new URL(request.url);
  url.pathname = url.pathname.replace("/api/private", "/api/v1");
  return app.fetch(
    new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      // Required by undici when forwarding a streaming body
      duplex: "half",
    } as RequestInit),
  );
};

export const GET = handleLegacyPath;
export const POST = handleLegacyPath;
export const DELETE = handleLegacyPath;
