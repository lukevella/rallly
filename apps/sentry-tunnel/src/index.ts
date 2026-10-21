import { resolveUpstream } from "./envelope.ts";

// The app posts here cross-origin. Exposing the rate limit headers lets the
// SDK back off when Sentry asks it to.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Expose-Headers": "X-Sentry-Rate-Limits, Retry-After",
  "Access-Control-Max-Age": "86400",
};

const forwardedResponseHeaders = ["X-Sentry-Rate-Limits", "Retry-After"];

// Browser envelopes carry errors and transactions only (no replays or
// attachments), which Sentry caps at 1 MB each, so anything larger is not
// worth buffering.
const maxBodyBytes = 5 * 1024 * 1024;

export default {
  async fetch(request: Request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response(null, {
        status: 405,
        headers: { ...corsHeaders, Allow: "POST, OPTIONS" },
      });
    }

    const contentLength = Number(request.headers.get("Content-Length"));
    if (contentLength > maxBodyBytes) {
      return new Response(null, { status: 413, headers: corsHeaders });
    }

    const body = await request.arrayBuffer();
    if (body.byteLength > maxBodyBytes) {
      return new Response(null, { status: 413, headers: corsHeaders });
    }

    const upstream = resolveUpstream(new Uint8Array(body));
    if (!upstream) {
      return new Response(null, { status: 400, headers: corsHeaders });
    }

    const upstreamHeaders = new Headers({
      "Content-Type":
        request.headers.get("Content-Type") ?? "application/x-sentry-envelope",
    });
    const contentEncoding = request.headers.get("Content-Encoding");
    if (contentEncoding) {
      upstreamHeaders.set("Content-Encoding", contentEncoding);
    }

    let response: Response;
    try {
      response = await fetch(upstream, {
        method: "POST",
        headers: upstreamHeaders,
        body,
      });
    } catch {
      return new Response(null, { status: 502, headers: corsHeaders });
    }

    const headers = new Headers(corsHeaders);
    for (const name of forwardedResponseHeaders) {
      const value = response.headers.get(name);
      if (value) {
        headers.set(name, value);
      }
    }

    return new Response(response.body, { status: response.status, headers });
  },
};
