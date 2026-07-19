import Stripe from "stripe";

export type { Stripe } from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-08-16",
  typescript: true,
});

export async function getProPricing() {
  const prices = await stripe.prices.list({
    lookup_keys: ["pro-monthly", "pro-yearly"],
    active: true,
  });

  // prices.data is ordered by creation date, not by lookup key
  const monthly = prices.data.find(
    (price) => price.lookup_key === "pro-monthly",
  );
  const yearly = prices.data.find((price) => price.lookup_key === "pro-yearly");

  if (monthly?.unit_amount == null || yearly?.unit_amount == null) {
    throw new Error("Price not found");
  }

  return {
    monthly: {
      id: monthly.id,
      amount: monthly.unit_amount,
      currency: monthly.currency,
    },
    yearly: {
      id: yearly.id,
      amount: yearly.unit_amount,
      currency: yearly.currency,
    },
  };
}

export type PricingData = Awaited<ReturnType<typeof getProPricing>>;
