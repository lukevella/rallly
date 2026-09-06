import Stripe from "stripe";
import { displayedCurrencies } from "../pricing";

export type { Stripe } from "stripe";

export function createStripeClient({ secretKey }: { secretKey: string }) {
  return new Stripe(secretKey, {
    apiVersion: "2023-08-16",
    typescript: true,
  });
}

export type PriceAmounts = {
  monthly: number;
  yearly: number;
};

export type PricesByCurrency = Record<string, PriceAmounts>;

function unitAmountsByCurrency(price: Stripe.Price) {
  const amounts: Record<string, number> = {};
  if (price.unit_amount !== null) {
    amounts[price.currency] = price.unit_amount;
  }
  for (const [currency, option] of Object.entries(
    price.currency_options ?? {},
  )) {
    if (option.unit_amount !== null && option.unit_amount !== undefined) {
      amounts[currency] = option.unit_amount;
    }
  }
  return amounts;
}

export function mapProPrices(prices: Stripe.Price[]) {
  const monthly = prices.find((price) => price.lookup_key === "pro-monthly");
  const yearly = prices.find((price) => price.lookup_key === "pro-yearly");

  if (
    !monthly ||
    !yearly ||
    monthly.unit_amount === null ||
    yearly.unit_amount === null
  ) {
    throw new Error("Price not found");
  }

  const monthlyAmounts = unitAmountsByCurrency(monthly);
  const yearlyAmounts = unitAmountsByCurrency(yearly);
  const currencies: PricesByCurrency = {};
  for (const currency of displayedCurrencies) {
    const monthlyAmount = monthlyAmounts[currency];
    const yearlyAmount = yearlyAmounts[currency];
    if (monthlyAmount !== undefined && yearlyAmount !== undefined) {
      currencies[currency] = { monthly: monthlyAmount, yearly: yearlyAmount };
    }
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
    currencies,
  };
}

export async function getProPricing({ stripe }: { stripe: Stripe }) {
  const prices = await stripe.prices.list({
    lookup_keys: ["pro-monthly", "pro-yearly"],
    expand: ["data.currency_options"],
  });

  return mapProPrices(prices.data);
}

export type PricingData = Awaited<ReturnType<typeof getProPricing>>;
