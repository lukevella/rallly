import Stripe from "stripe";
import type { ApiPollTier } from "../pricing";
import {
  API_POLL_TIERS,
  apiPollAddonAmounts,
  apiPollTierLimits,
  displayedCurrencies,
} from "../pricing";

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

export const ADDON_METADATA_KEY = "addon";
export const API_ADDON = "api";
export const API_POLL_LIMIT_METADATA_KEY = "api_poll_limit";

function isAddonItem(item: Stripe.SubscriptionItem) {
  return (
    item.price?.metadata != null && ADDON_METADATA_KEY in item.price.metadata
  );
}

export function findSeatItem(subscription: Stripe.Subscription) {
  return subscription.items.data.find((item) => !isAddonItem(item));
}

export function getSeatItem(subscription: Stripe.Subscription) {
  const item = findSeatItem(subscription);

  if (!item) {
    throw new Error(
      `Missing subscription item in subscription ${subscription.id}`,
    );
  }

  return item;
}

export function getApiPollAddonItem(subscription: Stripe.Subscription) {
  const item = subscription.items.data.find(
    (candidate) =>
      candidate.price?.metadata?.[ADDON_METADATA_KEY] === API_ADDON,
  );

  if (!item) {
    return null;
  }

  const raw = item.price.metadata[API_POLL_LIMIT_METADATA_KEY] ?? "";
  const limit = /^\d+$/.test(raw) ? Number.parseInt(raw, 10) : 0;

  if (!Number.isSafeInteger(limit) || limit <= 0) {
    return null;
  }

  const amount =
    item.price.currency_options?.[subscription.currency]?.unit_amount ??
    item.price.unit_amount;

  if (amount == null) {
    return null;
  }

  return { id: item.id, priceId: item.price.id, limit, amount };
}

export type ApiPollAddonInterval = "monthly" | "yearly";

export function apiPollAddonLookupKey({
  tier,
  interval,
}: {
  tier: ApiPollTier;
  interval: ApiPollAddonInterval;
}) {
  return `api-${tier}-${interval}`;
}

const API_POLL_ADDON_INTERVALS = ["monthly", "yearly"] as const;

function allApiPollAddonLookupKeys() {
  return API_POLL_TIERS.flatMap((tier) =>
    API_POLL_ADDON_INTERVALS.map((interval) =>
      apiPollAddonLookupKey({ tier, interval }),
    ),
  );
}

export function mapApiPollAddonPrices(prices: Stripe.Price[]) {
  const byKey = (key: string) =>
    toProPrice(prices.find((price) => price.lookup_key === key));

  const missing: string[] = [];
  const lookup = (tier: ApiPollTier, interval: ApiPollAddonInterval) => {
    const key = apiPollAddonLookupKey({ tier, interval });
    const found = byKey(key);
    if (!found) {
      missing.push(key);
    }
    return found as ProPrice;
  };

  const result = Object.fromEntries(
    API_POLL_TIERS.map((tier) => [
      tier,
      { monthly: lookup(tier, "monthly"), yearly: lookup(tier, "yearly") },
    ]),
  ) as Record<ApiPollTier, { monthly: ProPrice; yearly: ProPrice }>;

  if (missing.length > 0) {
    throw new Error(`API poll add-on prices not found: ${missing.join(", ")}`);
  }

  return result;
}

export async function getApiPollAddonPricing({ stripe }: { stripe: Stripe }) {
  const prices = await stripe.prices.list({
    lookup_keys: allApiPollAddonLookupKeys(),
    expand: ["data.currency_options"],
  });

  return mapApiPollAddonPrices(prices.data);
}

export function apiPollAddonPriceParams({
  product,
  tier,
  interval,
  taxBehavior,
}: {
  product: string;
  tier: ApiPollTier;
  interval: ApiPollAddonInterval;
  taxBehavior?: Stripe.Price.TaxBehavior;
}): Stripe.PriceCreateParams {
  const { usd, ...others } = apiPollAddonAmounts;
  return {
    product,
    currency: "usd",
    unit_amount: usd[tier][interval],
    recurring: { interval: interval === "monthly" ? "month" : "year" },
    lookup_key: apiPollAddonLookupKey({ tier, interval }),
    ...(taxBehavior && taxBehavior !== "unspecified"
      ? { tax_behavior: taxBehavior }
      : {}),
    metadata: {
      [ADDON_METADATA_KEY]: API_ADDON,
      [API_POLL_LIMIT_METADATA_KEY]: String(apiPollTierLimits[tier]),
    },
    currency_options: Object.fromEntries(
      Object.entries(others).map(([currency, amounts]) => [
        currency,
        { unit_amount: amounts[tier][interval] },
      ]),
    ),
  };
}

export function findApiPollAddonPriceMismatches({
  price,
  params,
}: {
  price: Stripe.Price;
  params: Stripe.PriceCreateParams;
}) {
  const mismatches: string[] = [];
  const check = ({
    field,
    actual,
    expected,
  }: {
    field: string;
    actual: unknown;
    expected: unknown;
  }) => {
    if (actual !== expected) {
      mismatches.push(`${field}: expected ${expected}, found ${actual}`);
    }
  };

  const productId =
    typeof price.product === "string" ? price.product : price.product.id;
  check({ field: "product", actual: productId, expected: params.product });
  check({ field: "active", actual: price.active, expected: true });
  check({
    field: "currency",
    actual: price.currency,
    expected: params.currency,
  });
  check({
    field: "unit_amount",
    actual: price.unit_amount,
    expected: params.unit_amount,
  });
  check({
    field: "interval",
    actual: price.recurring?.interval,
    expected: params.recurring?.interval,
  });
  check({
    field: "interval_count",
    actual: price.recurring?.interval_count,
    expected: 1,
  });
  check({
    field: "usage_type",
    actual: price.recurring?.usage_type,
    expected: "licensed",
  });
  check({
    field: "transform_quantity",
    actual: price.transform_quantity ?? null,
    expected: null,
  });
  if (params.tax_behavior) {
    check({
      field: "tax_behavior",
      actual: price.tax_behavior,
      expected: params.tax_behavior,
    });
    for (const [currency, option] of Object.entries(
      price.currency_options ?? {},
    )) {
      if (option.tax_behavior && option.tax_behavior !== params.tax_behavior) {
        mismatches.push(
          `${currency} tax_behavior: expected ${params.tax_behavior}, found ${option.tax_behavior}`,
        );
      }
    }
  }

  for (const [key, value] of Object.entries(params.metadata ?? {})) {
    check({
      field: `metadata.${key}`,
      actual: price.metadata?.[key],
      expected: value,
    });
  }

  const actualOptions = unitAmountsByCurrency({
    ...price,
    unit_amount: null,
  } as Stripe.Price);
  const expectedOptions = params.currency_options ?? {};
  for (const [currency, option] of Object.entries(expectedOptions)) {
    check({
      field: `${currency} unit_amount`,
      actual: actualOptions[currency],
      expected: option.unit_amount,
    });
  }
  for (const [currency, amount] of Object.entries(actualOptions)) {
    if (currency === price.currency) {
      check({
        field: `${currency} currency option`,
        actual: amount,
        expected: price.unit_amount,
      });
    } else if (!(currency in expectedOptions)) {
      mismatches.push(`unexpected currency option: ${currency}`);
    }
  }

  return mismatches;
}

export function findSharedProductProblem(prices: Stripe.Price[]) {
  const ids = new Set(
    prices.map((price) =>
      typeof price.product === "string" ? price.product : price.product.id,
    ),
  );
  if (ids.size > 1) {
    return `existing add-on prices span several products: ${[...ids].join(", ")}`;
  }
  return undefined;
}

export function findApiPollAddonProductTagProblem(
  product: Stripe.Product | Stripe.DeletedProduct,
) {
  if (product.deleted || product.metadata?.[ADDON_METADATA_KEY] !== API_ADDON) {
    return `product ${product.id} does not have metadata.${ADDON_METADATA_KEY}=${API_ADDON}`;
  }
  if (!product.active) {
    return `product ${product.id} is archived; unarchive it or move the add-on lookup keys to an active product`;
  }
  return undefined;
}
