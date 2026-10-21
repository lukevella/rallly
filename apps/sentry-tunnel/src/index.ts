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

    const body = await request.arrayBuffer();
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

    const response = await fetch(upstream, {
      method: "POST",
      headers: upstreamHeaders,
      body,
    });

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
