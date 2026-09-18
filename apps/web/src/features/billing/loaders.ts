import "server-only";

import type { PricingData } from "@rallly/billing";
import { CURRENCY_COOKIE_NAME, getCountryCurrency } from "@rallly/billing";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { isBillingEnabled } from "@/features/billing/constants";
import { getProPrices, getSpaceSubscription } from "@/features/billing/data";
import { isEarlySupporter } from "@/features/billing/utils";
import { getActiveSpace } from "@/features/space/loaders";
import { defineAbilityForMember } from "@/features/space/member/ability";
import { getCurrentUser, requireUser } from "@/features/user/loaders";
import { isFeatureEnabled } from "@/lib/feature-flags/server";

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
    const [pricing, cookieStore, headersList] = await Promise.all([
      getProPrices(),
      cookies(),
      headers(),
    ]);
    const prices = pricing.currencies;
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

/**
 * Everything the billing page needs about the active space's subscription,
 * with the early supporter verdict made here so no page compares price ids.
 * Pricing failures degrade to "not an early supporter, no comparison" rather
 * than failing the page.
 */
export const loadSubscriptionOverview = cache(async () => {
  const [user, space] = await Promise.all([getCurrentUser(), getActiveSpace()]);
  const subscription = await getSpaceSubscription(space.id);

  if (!subscription) {
    return null;
  }

  let pricing: PricingData | null = null;
  try {
    pricing = await getProPrices();
  } catch (error) {
    console.error("Failed to load Pro pricing", error);
  }

  const earlySupporter = isEarlySupporter({
    priceId: subscription.priceId,
    pricing,
  });
  const currency = subscription.currency;

  return {
    subscription,
    earlySupporter,
    listPrice: pricing
      ? {
          monthly: pricing.monthly.amounts[currency],
          yearly: pricing.yearly.amounts[currency],
        }
      : null,
    // The deletion recovery window reaps the space regardless of renewal;
    // resuming there would fight the reaper, so cancelling the deletion is
    // the only way to restore renewals.
    canResume: subscription.cancelAtPeriodEnd && !user?.deletedAt,
  };
});

/**
 * Whether to warn the active space about a failed payment. Gated on the same
 * ability as the billing page so the warning never links a member to a page
 * they get denied on. Reads the flag off the space DTO, which the session
 * gate already fetched, so the warning costs no extra query on any page.
 */
export const loadIsSubscriptionPastDue = cache(async () => {
  if (!isFeatureEnabled("billing")) {
    return false;
  }

  const [user, space] = await Promise.all([requireUser(), getActiveSpace()]);

  if (!space.subscriptionPastDue) {
    return false;
  }

  const ability = defineAbilityForMember({
    user: { id: user.id },
    space: { id: space.id, ownerId: space.ownerId, role: space.role },
  });

  return ability.can("manage", "Billing");
});
