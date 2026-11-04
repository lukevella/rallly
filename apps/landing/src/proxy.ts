import {
  displayedCurrencies,
  getCountryCurrency,
} from "@rallly/billing/pricing";
import { absoluteUrl } from "@rallly/utils/absolute-url";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { i18nMiddleware } from "@/i18n/middleware";
import { CURRENCY_COOKIE_NAME } from "@/lib/currency";
import {
  isHomePath,
  MARKDOWN_CONTENT_TYPE,
  notFoundMarkdown,
  prefersMarkdown,
} from "@/lib/markdown-negotiation";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const PROBE_TIMEOUT_MS = 3000;

// Only the homepage has a Markdown version. Other pages answer agents with
// their HTML, except a missing page, which gets a Markdown 404. Whether a
// path exists is only known after routing, so ask for the HTML version first.
async function negotiateMarkdown(req: NextRequest) {
  if (isHomePath(req.nextUrl.pathname)) {
    const response = NextResponse.rewrite(new URL("/index.md", req.url));
    response.headers.set("Vary", "Accept");
    return response;
  }

  let probe: Response;
  try {
    probe = await fetch(req.nextUrl, {
      method: "HEAD",
      headers: { accept: "text/html" },
      redirect: "manual",
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
  } catch {
    // Without a timely answer, serve the page as HTML rather than fail or
    // hold the request.
    return null;
  }

  if (probe.status === 404) {
    return new NextResponse(notFoundMarkdown(absoluteUrl()), {
      status: 404,
      headers: { "Content-Type": MARKDOWN_CONTENT_TYPE, Vary: "Accept" },
    });
  }

  return null;
}

export async function proxy(req: NextRequest) {
  if (prefersMarkdown(req.headers.get("accept"))) {
    const markdownResponse = await negotiateMarkdown(req);
    if (markdownResponse) return markdownResponse;
  }

  const response = i18nMiddleware(req);
  // Survives on redirects. Next.js replaces Vary on page responses.
  response.headers.append("Vary", "Accept");

  // The pricing page is cached, so it cannot read the country header itself.
  // Stamp the detected currency once and let the page pick it up client side.
  if (!req.cookies.has(CURRENCY_COOKIE_NAME)) {
    response.cookies.set(
      CURRENCY_COOKIE_NAME,
      getCountryCurrency(req.headers.get("x-vercel-ip-country") ?? undefined, [
        ...displayedCurrencies,
      ]),
      {
        path: "/",
        maxAge: ONE_YEAR_SECONDS,
        sameSite: "lax",
        domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
      },
    );
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|poll|.*\\.).*)"],
};
