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

export const PRO_LOOKUP_KEYS = {
  monthly: "pro-monthly",
  yearly: "pro-yearly",
  earlySupporterMonthly: "pro-monthly-early-supporter",
  earlySupporterYearly: "pro-yearly-early-supporter",
} as const;

export type ProPrice = {
  id: string;
  amount: number;
  currency: string;
  /** Unit amount per currency in minor units: base currency plus currency_options. */
  amounts: Record<string, number>;
};

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

function toProPrice(price: Stripe.Price | undefined): ProPrice | undefined {
  if (!price || price.unit_amount === null) {
    return undefined;
  }
  return {
    id: price.id,
    amount: price.unit_amount,
    currency: price.currency,
    amounts: unitAmountsByCurrency(price),
  };
}

export function mapProPrices(prices: Stripe.Price[]) {
  const byKey = (key: string) =>
    prices.find((price) => price.lookup_key === key);

  const monthly = toProPrice(byKey(PRO_LOOKUP_KEYS.monthly));
  const yearly = toProPrice(byKey(PRO_LOOKUP_KEYS.yearly));

  if (!monthly || !yearly) {
    throw new Error("Price not found");
  }

  const currencies: PricesByCurrency = {};
  for (const currency of displayedCurrencies) {
    const monthlyAmount = monthly.amounts[currency];
    const yearlyAmount = yearly.amounts[currency];
    if (monthlyAmount !== undefined && yearlyAmount !== undefined) {
      currencies[currency] = { monthly: monthlyAmount, yearly: yearlyAmount };
    }
  }

  // Both or neither: a subscriber must be able to move between the two
  // early supporter intervals, so a half finished rollout exposes nothing.
  const earlySupporterMonthly = toProPrice(
    byKey(PRO_LOOKUP_KEYS.earlySupporterMonthly),
  );
  const earlySupporterYearly = toProPrice(
    byKey(PRO_LOOKUP_KEYS.earlySupporterYearly),
  );

  return {
    monthly,
    yearly,
    currencies,
    earlySupporter:
      earlySupporterMonthly && earlySupporterYearly
        ? { monthly: earlySupporterMonthly, yearly: earlySupporterYearly }
        : undefined,
  };
}

export async function getProPricing({ stripe }: { stripe: Stripe }) {
  const prices = await stripe.prices.list({
    lookup_keys: Object.values(PRO_LOOKUP_KEYS),
    expand: ["data.currency_options"],
  });

  return mapProPrices(prices.data);
}

export type PricingData = Awaited<ReturnType<typeof getProPricing>>;
