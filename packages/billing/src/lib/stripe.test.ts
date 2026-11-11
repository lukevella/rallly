import { describe, expect, it } from "vitest";
import { API_POLL_TIERS, apiPollAddonAmounts } from "../pricing";
import type { Stripe } from "./stripe";
import {
  ADDON_METADATA_KEY,
  API_ADDON,
  API_POLL_LIMIT_METADATA_KEY,
  apiPollAddonLookupKey,
  apiPollAddonPriceParams,
  findApiPollAddonPriceMismatches,
  findApiPollAddonProductTagProblem,
  findSeatItem,
  findSharedProductProblem,
  getApiPollAddonItem,
  getSeatItem,
  mapApiPollAddonPrices,
  mapProPrices,
} from "./stripe";

function price(
  lookupKey: string,
  unitAmount: number,
  currencyOptions: Record<string, number> = {},
) {
  return {
    id: `price_${lookupKey}`,
    lookup_key: lookupKey,
    unit_amount: unitAmount,
    currency: "usd",
    currency_options: Object.fromEntries(
      Object.entries(currencyOptions).map(([currency, amount]) => [
        currency,
        { unit_amount: amount },
      ]),
    ),
  } as unknown as Stripe.Price;
}

describe("mapProPrices", () => {
  it("matches prices by lookup key regardless of list order", () => {
    const result = mapProPrices([
      price("pro-yearly", 5600),
      price("pro-monthly", 700),
    ]);
    expect(result.monthly.id).toBe("price_pro-monthly");
    expect(result.yearly.id).toBe("price_pro-yearly");
  });

  it("keeps the base currency amounts on the top level", () => {
    const result = mapProPrices([
      price("pro-monthly", 700),
      price("pro-yearly", 5600),
    ]);
    expect(result.monthly).toEqual({
      id: "price_pro-monthly",
      amount: 700,
      currency: "usd",
      amounts: { usd: 700 },
    });
    expect(result.yearly.amount).toBe(5600);
  });

  it("builds a per currency map limited to the displayed currencies both prices carry", () => {
    const result = mapProPrices([
      price("pro-monthly", 700, { eur: 650, gbp: 560, chf: 650, inr: 58000 }),
      price("pro-yearly", 5600, {
        eur: 5200,
        gbp: 4500,
        chf: 5600,
        inr: 580000,
      }),
    ]);
    expect(result.currencies).toEqual({
      usd: { monthly: 700, yearly: 5600 },
      eur: { monthly: 650, yearly: 5200 },
      gbp: { monthly: 560, yearly: 4500 },
    });
  });

  it("throws when a price is missing", () => {
    expect(() => mapProPrices([price("pro-monthly", 700)])).toThrow(
      "Price not found",
    );
  });

  it("carries every currency amount on each price", () => {
    const result = mapProPrices([
      price("pro-monthly", 700, { eur: 650 }),
      price("pro-yearly", 5600, { eur: 5200 }),
    ]);
    expect(result.monthly.amounts).toEqual({ usd: 700, eur: 650 });
    expect(result.yearly.amounts).toEqual({ usd: 5600, eur: 5200 });
  });

  it("leaves earlySupporter undefined when the early supporter keys are absent", () => {
    const result = mapProPrices([
      price("pro-monthly", 1000),
      price("pro-yearly", 8400),
    ]);
    expect(result.earlySupporter).toBeUndefined();
  });

  it("maps the early supporter prices when both keys are present", () => {
    const result = mapProPrices([
      price("pro-monthly", 1000),
      price("pro-yearly", 8400),
      price("pro-monthly-early-supporter", 700, { eur: 650 }),
      price("pro-yearly-early-supporter", 5600),
    ]);
    expect(result.earlySupporter).toEqual({
      monthly: {
        id: "price_pro-monthly-early-supporter",
        amount: 700,
        currency: "usd",
        amounts: { usd: 700, eur: 650 },
      },
      yearly: {
        id: "price_pro-yearly-early-supporter",
        amount: 5600,
        currency: "usd",
        amounts: { usd: 5600 },
      },
    });
  });

  it("ignores a lone early supporter key so a half finished rollout never exposes one interval", () => {
    const result = mapProPrices([
      price("pro-monthly", 1000),
      price("pro-yearly", 8400),
      price("pro-monthly-early-supporter", 700),
    ]);
    expect(result.earlySupporter).toBeUndefined();
  });
});

function item({
  id,
  metadata,
  unitAmount = 700,
  currencyOptions = {},
}: {
  id: string;
  metadata?: Record<string, string>;
  unitAmount?: number;
  currencyOptions?: Record<string, number>;
}) {
  return {
    id,
    quantity: 1,
    price: {
      id: `price_${id}`,
      unit_amount: unitAmount,
      ...(metadata ? { metadata } : {}),
      currency_options: Object.fromEntries(
        Object.entries(currencyOptions).map(([currency, amount]) => [
          currency,
          { unit_amount: amount },
        ]),
      ),
    },
  } as unknown as Stripe.SubscriptionItem;
}

function subscription(items: Stripe.SubscriptionItem[], currency = "usd") {
  return {
    id: "sub_1",
    currency,
    items: { data: items },
  } as unknown as Stripe.Subscription;
}

const seat = item({ id: "si_seat", metadata: {} });
const addon = item({
  id: "si_addon",
  metadata: { addon: "api", api_poll_limit: "1000" },
  unitAmount: 500,
  currencyOptions: { eur: 450 },
});

describe.each([
  ["findSeatItem", findSeatItem],
  ["getSeatItem", getSeatItem],
])("%s", (_name, find) => {
  it("returns the only item with no metadata key", () => {
    const only = item({ id: "si_only", metadata: {} });
    expect(find(subscription([only]))).toBe(only);
  });

  it("returns the only item when metadata is absent", () => {
    const only = item({ id: "si_only" });
    expect(find(subscription([only]))).toBe(only);
  });

  it("returns the seat when the add-on is first", () => {
    expect(find(subscription([addon, seat]))).toBe(seat);
  });

  it("returns the seat when the add-on is second", () => {
    expect(find(subscription([seat, addon]))).toBe(seat);
  });
});

describe("findSeatItem with a malformed item", () => {
  it("counts an item without a price as the seat", () => {
    const noPrice = { id: "si_noprice" } as unknown as Stripe.SubscriptionItem;
    expect(findSeatItem(subscription([noPrice]))).toBe(noPrice);
  });
});

describe("add-on flag", () => {
  const limitOnly = item({
    id: "si_limit",
    metadata: { api_poll_limit: "50" },
  });
  const other = item({
    id: "si_other",
    metadata: { addon: "something_else", api_poll_limit: "50" },
  });

  it("treats a price with a limit but no addon key as a seat", () => {
    expect(findSeatItem(subscription([limitOnly]))).toBe(limitOnly);
    expect(getApiPollAddonItem(subscription([limitOnly]))).toBeNull();
  });

  it("treats another add-on type as neither seat nor API poll add-on", () => {
    expect(findSeatItem(subscription([other]))).toBeUndefined();
    expect(getApiPollAddonItem(subscription([seat, other]))).toBeNull();
  });
});

describe("findSeatItem with no seat", () => {
  it("returns undefined with only an add-on", () => {
    expect(findSeatItem(subscription([addon]))).toBeUndefined();
  });

  it("returns undefined with no items", () => {
    expect(findSeatItem(subscription([]))).toBeUndefined();
  });
});

describe("getSeatItem with no seat", () => {
  it("throws with only an add-on", () => {
    expect(() => getSeatItem(subscription([addon]))).toThrow();
  });

  it("throws with no items", () => {
    expect(() => getSeatItem(subscription([]))).toThrow();
  });
});

describe("getApiPollAddonItem", () => {
  it("parses the limit", () => {
    expect(getApiPollAddonItem(subscription([seat, addon]))).toMatchObject({
      id: "si_addon",
      priceId: "price_si_addon",
      limit: 1000,
    });
  });

  it("reads the amount for the subscription currency", () => {
    expect(
      getApiPollAddonItem(subscription([seat, addon], "eur"))?.amount,
    ).toBe(450);
  });

  it("falls back to the base unit amount", () => {
    expect(
      getApiPollAddonItem(subscription([seat, addon], "gbp"))?.amount,
    ).toBe(500);
  });

  it("returns null on a single item subscription", () => {
    expect(getApiPollAddonItem(subscription([seat]))).toBeNull();
  });

  it("returns null when the amount is null", () => {
    const noAmount = {
      id: "si_noamount",
      price: {
        id: "price_noamount",
        unit_amount: null,
        metadata: { addon: "api", api_poll_limit: "1000" },
      },
    } as unknown as Stripe.SubscriptionItem;
    expect(getApiPollAddonItem(subscription([seat, noAmount]))).toBeNull();
  });

  it.each([
    "abc",
    "0",
    "-5",
    "12abc",
    "1.5",
  ])("returns null for limit %s", (limit) => {
    const bad = item({
      id: "si_bad",
      metadata: { addon: "api", api_poll_limit: limit },
    });
    expect(getApiPollAddonItem(subscription([seat, bad]))).toBeNull();
  });
});

describe("apiPollAddonLookupKey", () => {
  it("names the tier and interval", () => {
    expect(apiPollAddonLookupKey({ tier: "large", interval: "yearly" })).toBe(
      "api-large-yearly",
    );
    expect(apiPollAddonLookupKey({ tier: "small", interval: "monthly" })).toBe(
      "api-small-monthly",
    );
  });
});

function addonPrices() {
  return API_POLL_TIERS.flatMap((tier) => {
    const { usd, eur, gbp } = {
      usd: apiPollAddonAmounts.usd[tier],
      eur: apiPollAddonAmounts.eur[tier],
      gbp: apiPollAddonAmounts.gbp[tier],
    };
    return [
      price(apiPollAddonLookupKey({ tier, interval: "monthly" }), usd.monthly, {
        eur: eur.monthly,
        gbp: gbp.monthly,
      }),
      price(apiPollAddonLookupKey({ tier, interval: "yearly" }), usd.yearly, {
        eur: eur.yearly,
        gbp: gbp.yearly,
      }),
    ];
  });
}

describe("mapApiPollAddonPrices", () => {
  it("maps eight prices to four tiers with monthly and yearly", () => {
    const result = mapApiPollAddonPrices(addonPrices().reverse());
    expect(Object.keys(result)).toEqual(["small", "medium", "large", "xlarge"]);
    expect(result.large.monthly.id).toBe("price_api-large-monthly");
    expect(result.large.yearly.id).toBe("price_api-large-yearly");
    expect(result.large.monthly.amount).toBe(9000);
    expect(result.large.monthly.amounts).toEqual({
      usd: 9000,
      eur: 8000,
      gbp: 7000,
    });
    expect(result.small.yearly.amounts).toEqual({
      usd: 30000,
      eur: 27000,
      gbp: 24000,
    });
  });

  it("throws naming the missing key", () => {
    const prices = addonPrices().filter(
      (p) => p.lookup_key !== "api-medium-yearly",
    );
    expect(() => mapApiPollAddonPrices(prices)).toThrow("api-medium-yearly");
  });
});

describe("apiPollAddonPriceParams", () => {
  it("builds the create params for one tier and interval", () => {
    expect(
      apiPollAddonPriceParams({
        product: "prod_1",
        tier: "large",
        interval: "yearly",
        taxBehavior: "exclusive",
      }),
    ).toEqual({
      product: "prod_1",
      currency: "usd",
      unit_amount: 90000,
      recurring: { interval: "year" },
      lookup_key: "api-large-yearly",
      tax_behavior: "exclusive",
      metadata: {
        [ADDON_METADATA_KEY]: API_ADDON,
        [API_POLL_LIMIT_METADATA_KEY]: "1000",
      },
      currency_options: {
        eur: { unit_amount: 80000 },
        gbp: { unit_amount: 70000 },
      },
    });
  });

  it("omits tax behavior when none is given", () => {
    const params = apiPollAddonPriceParams({
      product: "prod_1",
      tier: "small",
      interval: "monthly",
    });
    expect(params).not.toHaveProperty("tax_behavior");
    expect(params.recurring).toEqual({ interval: "month" });
  });
});

describe("findApiPollAddonPriceMismatches", () => {
  const params = apiPollAddonPriceParams({
    product: "prod_1",
    tier: "medium",
    interval: "monthly",
  });

  function existing(overrides: Record<string, unknown> = {}) {
    return {
      id: "price_1",
      product: "prod_1",
      currency: "usd",
      unit_amount: 5000,
      active: true,
      recurring: {
        interval: "month",
        interval_count: 1,
        usage_type: "licensed",
      },
      metadata: { addon: "api", api_poll_limit: "500" },
      currency_options: {
        eur: { unit_amount: 4500 },
        gbp: { unit_amount: 4000 },
      },
      ...overrides,
    } as unknown as Stripe.Price;
  }

  it("reports nothing when the price matches", () => {
    expect(
      findApiPollAddonPriceMismatches({ price: existing(), params }),
    ).toEqual([]);
  });

  it("reports each difference", () => {
    const mismatches = findApiPollAddonPriceMismatches({
      price: existing({
        unit_amount: 4000,
        recurring: {
          interval: "year",
          interval_count: 1,
          usage_type: "licensed",
        },
        metadata: { addon: "api" },
        currency_options: { eur: { unit_amount: 4500 } },
      }),
      params,
    });
    expect(mismatches).toHaveLength(4);
    expect(mismatches.join("\n")).toContain("unit_amount");
    expect(mismatches.join("\n")).toContain("interval");
    expect(mismatches.join("\n")).toContain(API_POLL_LIMIT_METADATA_KEY);
    expect(mismatches.join("\n")).toContain("gbp");
  });

  it("reports a metered price", () => {
    const mismatches = findApiPollAddonPriceMismatches({
      price: existing({
        recurring: {
          interval: "month",
          interval_count: 1,
          usage_type: "metered",
        },
      }),
      params,
    });
    expect(mismatches).toEqual([
      "usage_type: expected licensed, found metered",
    ]);
  });

  it("reports a price that transforms the quantity", () => {
    const mismatches = findApiPollAddonPriceMismatches({
      price: existing({ transform_quantity: { divide_by: 10, round: "up" } }),
      params,
    });
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toContain("transform_quantity");
  });

  it("compares tax behavior only when one is expected", () => {
    const inclusive = existing({
      tax_behavior: "inclusive",
      currency_options: {
        eur: { unit_amount: 4500, tax_behavior: "inclusive" },
        gbp: { unit_amount: 4000 },
      },
    });
    expect(
      findApiPollAddonPriceMismatches({ price: inclusive, params }),
    ).toEqual([]);

    const exclusiveParams = apiPollAddonPriceParams({
      product: "prod_1",
      tier: "medium",
      interval: "monthly",
      taxBehavior: "exclusive",
    });
    expect(
      findApiPollAddonPriceMismatches({
        price: inclusive,
        params: exclusiveParams,
      }),
    ).toEqual([
      "tax_behavior: expected exclusive, found inclusive",
      "eur tax_behavior: expected exclusive, found inclusive",
    ]);
  });
});

describe("findApiPollAddonPriceMismatches with the default currency listed", () => {
  const params = apiPollAddonPriceParams({
    product: "prod_1",
    tier: "medium",
    interval: "monthly",
  });

  function existing(usdOption: number) {
    return {
      id: "price_1",
      product: "prod_1",
      currency: "usd",
      unit_amount: 5000,
      active: true,
      recurring: {
        interval: "month",
        interval_count: 1,
        usage_type: "licensed",
      },
      metadata: { addon: "api", api_poll_limit: "500" },
      currency_options: {
        usd: { unit_amount: usdOption },
        eur: { unit_amount: 4500 },
        gbp: { unit_amount: 4000 },
      },
    } as unknown as Stripe.Price;
  }

  it("accepts a usd option equal to the unit amount", () => {
    expect(
      findApiPollAddonPriceMismatches({ price: existing(5000), params }),
    ).toEqual([]);
  });

  it("reports a usd option that differs", () => {
    const mismatches = findApiPollAddonPriceMismatches({
      price: existing(4000),
      params,
    });
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toContain("usd");
  });
});

describe("add-on product checks", () => {
  const onProduct = (id: string) =>
    ({ product: id }) as unknown as Stripe.Price;
  const product = (metadata: Record<string, string>, active = true) =>
    ({ id: "prod_1", active, metadata }) as unknown as Stripe.Product;

  it("passes with no prices", () => {
    expect(findSharedProductProblem([])).toBeUndefined();
  });

  it("passes when prices share one product", () => {
    expect(
      findSharedProductProblem([onProduct("prod_1"), onProduct("prod_1")]),
    ).toBeUndefined();
  });

  it("fails when prices span two products", () => {
    expect(
      findSharedProductProblem([onProduct("prod_1"), onProduct("prod_2")]),
    ).toContain("several products");
  });

  it("passes a product tagged as the add-on", () => {
    expect(
      findApiPollAddonProductTagProblem(product({ addon: "api" })),
    ).toBeUndefined();
  });

  it("fails an archived add-on product", () => {
    expect(
      findApiPollAddonProductTagProblem(product({ addon: "api" }, false)),
    ).toContain("archived");
  });

  it("fails a product without the add-on tag", () => {
    expect(findApiPollAddonProductTagProblem(product({}))).toContain(
      "metadata.addon",
    );
  });
});
