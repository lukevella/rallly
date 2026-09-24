import "server-only";

import {
  NONPROFIT_COUPON_ID,
  NONPROFIT_DISCOUNT_PERCENT,
} from "@/features/billing/nonprofit/constants";
import { getStripe } from "@/features/billing/service";
import {
  isStripeErrorCode,
  isStripeResourceMissingError,
} from "@/features/billing/utils";

let couponPromise: Promise<string> | undefined;

/**
 * The Stripe coupon behind the discount, created on first use so there is
 * no dashboard step and test and live mode behave the same. Memoised per
 * process; a failed attempt is forgotten so the next call retries.
 */
export function ensureNonprofitCoupon() {
  couponPromise ??= (async () => {
    const stripe = getStripe();
    try {
      await stripe.coupons.retrieve(NONPROFIT_COUPON_ID);
    } catch (error) {
      if (!isStripeResourceMissingError(error)) throw error;
      try {
        await stripe.coupons.create({
          id: NONPROFIT_COUPON_ID,
          percent_off: NONPROFIT_DISCOUNT_PERCENT,
          duration: "forever",
          name: "Nonprofit discount",
        });
      } catch (createError) {
        // Two processes racing on first use: the other one won.
        if (!isStripeErrorCode(createError, "resource_already_exists")) {
          throw createError;
        }
      }
    }
    return NONPROFIT_COUPON_ID;
  })().catch((error) => {
    couponPromise = undefined;
    throw error;
  });

  return couponPromise;
}
