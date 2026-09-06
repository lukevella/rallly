import { describe, expect, it } from "vitest";
import type { Stripe } from "./stripe";
import { mapProPrices } from "./stripe";

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
    });
    expect(result.yearly.amount).toBe(5600);
  });

  it("builds a per currency map from the base currency and the options both prices share", () => {
    const result = mapProPrices([
      price("pro-monthly", 700, { eur: 650, gbp: 560, chf: 650, inr: 58000 }),
      price("pro-yearly", 5600, { eur: 5200, gbp: 4500, chf: 5600 }),
    ]);
    expect(result.currencies).toEqual({
      usd: { monthly: 700, yearly: 5600 },
      eur: { monthly: 650, yearly: 5200 },
      gbp: { monthly: 560, yearly: 4500 },
      chf: { monthly: 650, yearly: 5600 },
    });
  });

  it("throws when a price is missing", () => {
    expect(() => mapProPrices([price("pro-monthly", 700)])).toThrow(
      "Price not found",
    );
  });
});
