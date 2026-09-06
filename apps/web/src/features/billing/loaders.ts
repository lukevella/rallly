import "server-only";

import { headers } from "next/headers";
import { cache } from "react";
import { isBillingEnabled } from "@/features/billing/constants";
import { getProPrices } from "@/features/billing/data";
import { getCountryCurrency } from "@/features/billing/utils";

/**
 * Prices for the pay wall plus the currency to show first, from the request
 * country Vercel stamps on every request. Null when there is nothing to pay
 * for, and when Stripe is unreachable so the pay wall degrades to the built
 * in prices rather than the layout failing.
 */
export const loadPayWallPricing = cache(async () => {
  if (!isBillingEnabled) {
    return null;
  }
  try {
    const [prices, headersList] = await Promise.all([
      getProPrices(),
      headers(),
    ]);
    const available = Object.keys(prices);
    if (available.length === 0) {
      return null;
    }
    return {
      prices,
      defaultCurrency: getCountryCurrency(
        headersList.get("x-vercel-ip-country") ?? undefined,
        available,
      ),
    };
  } catch (error) {
    console.error("Failed to load pay wall pricing", error);
    return null;
  }
});
