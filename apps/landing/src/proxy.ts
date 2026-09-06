import {
  displayedCurrencies,
  getCountryCurrency,
  isDisplayedCurrency,
} from "@rallly/billing/pricing";
import type { NextRequest } from "next/server";
import { i18nMiddleware } from "@/i18n/middleware";
import {
  CURRENCY_COOKIE_NAME,
  LEGACY_CURRENCY_COOKIE_NAME,
} from "@/lib/currency";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function proxy(req: NextRequest) {
  const response = i18nMiddleware(req);

  // The pricing page is cached, so it cannot read the country header itself.
  // Stamp the detected currency once and let the page pick it up client side.
  if (!req.cookies.has(CURRENCY_COOKIE_NAME)) {
    // A visitor from the first release carries the value under the legacy
    // host only name; keep their choice and move it to the shared cookie.
    const legacy = req.cookies.get(LEGACY_CURRENCY_COOKIE_NAME)?.value;
    response.cookies.set(
      CURRENCY_COOKIE_NAME,
      legacy && isDisplayedCurrency(legacy)
        ? legacy
        : getCountryCurrency(
            req.headers.get("x-vercel-ip-country") ?? undefined,
            [...displayedCurrencies],
          ),
      {
        path: "/",
        maxAge: ONE_YEAR_SECONDS,
        sameSite: "lax",
        domain: process.env.NEXT_PUBLIC_COOKIE_DOMAIN || undefined,
      },
    );
  }

  if (req.cookies.has(LEGACY_CURRENCY_COOKIE_NAME)) {
    response.cookies.delete({ name: LEGACY_CURRENCY_COOKIE_NAME, path: "/" });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|poll|.*\\.).*)"],
};
