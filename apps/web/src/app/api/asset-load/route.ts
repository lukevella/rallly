import type { NextRequest } from "next/server";
import { assetLoadReportSchema } from "@/lib/asset-load-report";
import { trackSystemEvent, withPostHog } from "@/lib/posthog";
import { createRatelimit } from "@/lib/rate-limit";

// Unauthenticated: the visitors this is for could not load the app at all.
// The inline script reports once per tab, so this budget only stops abuse.
const ratelimit = createRatelimit(20, "1 h");

const MAX_BODY_BYTES = 512;

// Stops reading once the body passes the limit instead of buffering whatever
// an unauthenticated client sends. Returns null when the body is too large.
async function readBoundedText(req: NextRequest, limit: number) {
  if (!req.body) return "";
  const reader = req.body.getReader();
  const decoder = new TextDecoder();
  let total = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return text + decoder.decode();
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
}

// Receives the report posted by the inline script in lib/asset-load-report.ts.
// sendBeacon posts a string as text/plain, so the body is parsed by hand.
export const POST = withPostHog(async (req: NextRequest) => {
  if (ratelimit) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    // A rate limiter outage must not hide the reports, so it fails open.
    const result = await ratelimit
      .limit(`api:asset-load:${ip || "unknown"}`)
      .catch(() => null);
    if (result && !result.success) return new Response(null, { status: 429 });
  }

  const text = await readBoundedText(req, MAX_BODY_BYTES);
  if (text === null) return new Response(null, { status: 413 });

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400 });
  }
  const report = assetLoadReportSchema.safeParse(json);
  if (!report.success) return new Response(null, { status: 400 });

  const { outcome, failed, loaded, scriptsRan, ms } = report.data;
  // Personless and without the page URL, which can carry a poll id. Country
  // and network say where the block sits; the user agent says which browser.
  trackSystemEvent({
    event: "asset_host:asset_load_fail",
    properties: {
      outcome,
      failed_count: failed,
      loaded_count: loaded,
      scripts_ran: scriptsRan,
      elapsed_ms: ms,
      country: req.headers.get("x-vercel-ip-country") ?? undefined,
      asn: req.headers.get("x-vercel-ip-as-number") ?? undefined,
      user_agent: req.headers.get("user-agent")?.slice(0, 256) ?? undefined,
    },
  });

  return new Response(null, { status: 204 });
});
