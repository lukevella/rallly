import { describe, expect, it } from "vitest";
import { resolveGrandfatheredPricing } from "./utils";

const listPrices = {
  monthly: { amount: 1000, currency: "usd" },
  yearly: { amount: 8000, currency: "usd" },
};

describe("resolveGrandfatheredPricing", () => {
  it("returns pricing when the subscription is below the monthly list price", () => {
    expect(
      resolveGrandfatheredPricing({
        subscription: {
          active: true,
          amount: 700,
          currency: "usd",
          interval: "month",
        },
        listPrices,
      }),
    ).toEqual({
      amount: 700,
      listAmount: 1000,
      currency: "usd",
      interval: "month",
    });
  });

  it("compares yearly subscriptions against the yearly list price", () => {
    expect(
      resolveGrandfatheredPricing({
        subscription: {
          active: true,
          amount: 3000,
          currency: "usd",
          interval: "year",
        },
        listPrices,
      }),
    ).toEqual({
      amount: 3000,
      listAmount: 8000,
      currency: "usd",
      interval: "year",
    });
  });

  it("returns null when the subscription is on the list price", () => {
    expect(
      resolveGrandfatheredPricing({
        subscription: {
          active: true,
          amount: 1000,
          currency: "usd",
          interval: "month",
        },
        listPrices,
      }),
    ).toBeNull();
  });

  it("returns null when the subscription is above the list price", () => {
    expect(
      resolveGrandfatheredPricing({
        subscription: {
          active: true,
          amount: 1200,
          currency: "usd",
          interval: "month",
        },
        listPrices,
      }),
    ).toBeNull();
  });

  it("returns null when the subscription is inactive", () => {
    expect(
      resolveGrandfatheredPricing({
        subscription: {
          active: false,
          amount: 700,
          currency: "usd",
          interval: "month",
        },
        listPrices,
      }),
    ).toBeNull();
  });

  it("returns null when currencies differ", () => {
    expect(
      resolveGrandfatheredPricing({
        subscription: {
          active: true,
          amount: 700,
          currency: "eur",
          interval: "month",
        },
        listPrices,
      }),
    ).toBeNull();
  });

  it("ignores currency casing", () => {
    expect(
      resolveGrandfatheredPricing({
        subscription: {
          active: true,
          amount: 700,
          currency: "USD",
          interval: "month",
        },
        listPrices,
      }),
    ).not.toBeNull();
  });
});
