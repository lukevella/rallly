import { describe, expect, it } from "vitest";
import type { Stripe } from "./stripe";
import {
  findSeatItem,
  getApiPollAddonItem,
  getSeatItem,
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
  metadata: { addon: "api_polls", api_poll_limit: "1000" },
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
        metadata: { addon: "api_polls", api_poll_limit: "1000" },
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
      metadata: { addon: "api_polls", api_poll_limit: limit },
    });
    expect(getApiPollAddonItem(subscription([seat, bad]))).toBeNull();
  });
});
