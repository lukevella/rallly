import {
  displayedCurrencies,
  getCountryCurrency,
} from "@rallly/billing/pricing";
import type { NextRequest } from "next/server";
import { i18nMiddleware } from "@/i18n/middleware";
import { CURRENCY_COOKIE_NAME } from "@/lib/currency";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function proxy(req: NextRequest) {
  const response = i18nMiddleware(req);

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
