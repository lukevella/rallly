import "server-only";

import { CURRENCY_COOKIE_NAME, getCountryCurrency } from "@rallly/billing";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { isBillingEnabled } from "@/features/billing/constants";
import { getProPrices } from "@/features/billing/data";

/**
 * Prices for the pay wall plus the currency to show first: the currency the
 * visitor picked or was detected with on the pricing page (shared cookie),
 * else the request country Vercel stamps on every request. Null when there
 * is nothing to pay for, and when Stripe is unreachable so the pay wall
 * degrades to the built in prices rather than the layout failing.
 */
export const loadPayWallPricing = cache(async () => {
  if (!isBillingEnabled) {
    return null;
  }
  try {
    const [prices, cookieStore, headersList] = await Promise.all([
      getProPrices(),
      cookies(),
      headers(),
    ]);
    const available = Object.keys(prices);
    if (available.length === 0) {
      return null;
    }
    // Own key only: the cookie is visitor controlled.
    const chosen = cookieStore.get(CURRENCY_COOKIE_NAME)?.value;
    return {
      prices,
      defaultCurrency:
        chosen && Object.hasOwn(prices, chosen)
          ? chosen
          : getCountryCurrency(
              headersList.get("x-vercel-ip-country") ?? undefined,
              available,
            ),
    };
  } catch (error) {
    console.error("Failed to load pay wall pricing", error);
    return null;
  }
});
