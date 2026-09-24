import type { Stripe } from "@rallly/billing";

/**
 * Checkout params for the discount. Stripe rejects `discounts` together
 * with `allow_promotion_codes`, so an entitled space gets the coupon and
 * loses the promotion code field, on the session and on the recovery email
 * alike; everyone else keeps the field.
 */
export function buildCheckoutDiscountParams(coupon: string | null): {
  session: Pick<
    Stripe.Checkout.SessionCreateParams,
    "discounts" | "allow_promotion_codes"
  >;
  recovery: Pick<
    Stripe.Checkout.SessionCreateParams.AfterExpiration.Recovery,
    "allow_promotion_codes"
  >;
} {
  if (coupon) {
    return {
      session: { discounts: [{ coupon }] },
      recovery: { allow_promotion_codes: false },
    };
  }
  return {
    session: { allow_promotion_codes: true },
    recovery: { allow_promotion_codes: true },
  };
}
