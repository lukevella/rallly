import { getPreferredLocale } from "@rallly/languages/get-preferred-locale";
import type { NextRequest } from "next/server";
import { fallbackLng, languages } from "@/i18n/settings";

// Edge bucketing for the landing CTA copy experiment. The home page is
// statically cached, so the variant is decided here and served by rewriting
// to a second statically generated route — the visitor's URL stays "/".
//
// PostHog stays the control plane: the variant comes from its /flags endpoint
// (a deterministic hash of the distinct id, so assignment is sticky by
// itself), and the ph_ff_* cookie is only a latency cache. While the
// experiment is a draft or after it stops, /flags returns no variant and
// everyone gets control with no deploy needed. The client bootstraps
// posthog-js from the same cookies (see @rallly/posthog/client), so exposure
// events report the variant the visitor actually saw.

const EXPERIMENT_FLAG = "landing-cta-copy";
const REWRITE_VARIANT = "create-free-poll";
const FLAG_COOKIE = `ph_ff_${EXPERIMENT_FLAG}`;
const DISTINCT_ID_COOKIE = "ph_did";
const FLAG_COOKIE_MAX_AGE = 60 * 60;
const DISTINCT_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
const FLAGS_REQUEST_TIMEOUT_MS = 300;

const BOT_PATTERN =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|vercel-screenshot|lighthouse/i;

type CookieToSet = { name: string; value: string; maxAge: number };

export type ExperimentDecision = {
  locale: string;
  variant: string;
  cookies: CookieToSet[];
};

function getHomeLocale(req: NextRequest): string | null {
  const { pathname } = req.nextUrl;
  if (pathname === "/") {
    // A non-default preferred locale gets redirected by the i18n middleware
    // first; the experiment applies on the follow-up localized request.
    const preferredLocale = getPreferredLocale({
      acceptLanguageHeader: req.headers.get("accept-language") ?? undefined,
    });
    return preferredLocale === fallbackLng ? fallbackLng : null;
  }
  const locale = languages.find((lng) => pathname === `/${lng}`);
  // "/en" redirects to "/" in the i18n middleware; skip it here.
  return locale && locale !== fallbackLng ? locale : null;
}

function readPosthogDistinctId(req: NextRequest): string | undefined {
  for (const cookie of req.cookies.getAll()) {
    if (cookie.name.startsWith("ph_") && cookie.name.endsWith("_posthog")) {
      try {
        const parsed = JSON.parse(decodeURIComponent(cookie.value));
        if (typeof parsed.distinct_id === "string") {
          return parsed.distinct_id;
        }
      } catch {
        // fall through to the ph_did cookie or a fresh id
      }
    }
  }
  return undefined;
}

async function fetchVariant(distinctId: string): Promise<string | null> {
  const host = process.env.NEXT_PUBLIC_POSTHOG_API_HOST;
  const apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
  if (!host || !apiKey) {
    return null;
  }
  try {
    const res = await fetch(`${host}/flags/?v=2`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: apiKey, distinct_id: distinctId }),
      signal: AbortSignal.timeout(FLAGS_REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    const value =
      data?.flags?.[EXPERIMENT_FLAG]?.variant ??
      data?.featureFlags?.[EXPERIMENT_FLAG];
    return typeof value === "string" ? value : "control";
  } catch {
    return null;
  }
}

export async function getCtaExperimentDecision(
  req: NextRequest,
): Promise<ExperimentDecision | null> {
  const locale = getHomeLocale(req);
  if (!locale) {
    return null;
  }
  if (BOT_PATTERN.test(req.headers.get("user-agent") ?? "")) {
    return null;
  }

  const cached = req.cookies.get(FLAG_COOKIE)?.value;
  if (cached) {
    return { locale, variant: cached, cookies: [] };
  }

  const cookies: CookieToSet[] = [];
  let distinctId =
    readPosthogDistinctId(req) ?? req.cookies.get(DISTINCT_ID_COOKIE)?.value;
  if (!distinctId) {
    distinctId = crypto.randomUUID();
    cookies.push({
      name: DISTINCT_ID_COOKIE,
      value: distinctId,
      maxAge: DISTINCT_ID_COOKIE_MAX_AGE,
    });
  }

  const variant = await fetchVariant(distinctId);
  if (variant === null) {
    // PostHog was unreachable: serve control without caching the miss so the
    // next request retries with the same distinct id.
    return { locale, variant: "control", cookies };
  }
  cookies.push({
    name: FLAG_COOKIE,
    value: variant,
    maxAge: FLAG_COOKIE_MAX_AGE,
  });
  return { locale, variant, cookies };
}

export function getVariantRewritePath(
  decision: ExperimentDecision,
): string | null {
  if (decision.variant !== REWRITE_VARIANT) {
    return null;
  }
  return `/${decision.locale}/exp/landing-cta-${REWRITE_VARIANT}`;
}
