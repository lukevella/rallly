import {
  displayedCurrencies,
  getCountryCurrency,
} from "@rallly/billing/pricing";
import type { NextRequest } from "next/server";
import { i18nMiddleware } from "@/i18n/middleware";
import { CURRENCY_COOKIE_NAME, CURRENCY_HEADER_NAME } from "@/lib/currency";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function proxy(req: NextRequest) {
  // The pricing page reads the request under Suspense, so the detected
  // currency travels as a request header for the first render and as a
  // cookie afterwards. The cookie is set once so a visitor's own choice sticks.
  const currency =
    req.cookies.get(CURRENCY_COOKIE_NAME)?.value ??
    getCountryCurrency(req.headers.get("x-vercel-ip-country") ?? undefined, [
      ...displayedCurrencies,
    ]);
  req.headers.set(CURRENCY_HEADER_NAME, currency);

  const response = i18nMiddleware(req);

  if (!req.cookies.has(CURRENCY_COOKIE_NAME)) {
    response.cookies.set(CURRENCY_COOKIE_NAME, currency, {
      path: "/",
      maxAge: ONE_YEAR_SECONDS,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|static|poll|.*\\.).*)"],
};
