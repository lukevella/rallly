import { stripe } from "..";

export async function getPricing() {
  const prices = await stripe.prices.list({
    lookup_keys: ["pro-monthly", "pro-yearly"],
  });

  const [monthly, yearly] = prices.data;

  return {
    monthly: {
      currency: monthly.currency,
      price: monthly.unit_amount_decimal,
    },
    yearly: {
      currency: yearly.currency,
      price: yearly.unit_amount,
    },
  };
}
