import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatMinorUnitAmount,
  isEarlySupporter,
  resolvePriceSet,
} from "./utils";

// isBillingEnabled is a module constant read from the environment, so each
// branch needs a fresh module registry to observe the stubbed value.
const loadResolveSpaceTier = async (selfHosted: boolean) => {
  vi.stubEnv("NEXT_PUBLIC_SELF_HOSTED", selfHosted ? "true" : "false");
  vi.resetModules();
  const { resolveSpaceTier } = await import("./utils");
  return resolveSpaceTier;
};

describe("resolveSpaceTier", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the stored tier when billing is enabled", async () => {
    const resolveSpaceTier = await loadResolveSpaceTier(false);

    expect(resolveSpaceTier("hobby")).toBe("hobby");
    expect(resolveSpaceTier("pro")).toBe("pro");
  });

  it("treats every space as pro when there is no billing", async () => {
    const resolveSpaceTier = await loadResolveSpaceTier(true);

    expect(resolveSpaceTier("hobby")).toBe("pro");
    expect(resolveSpaceTier("pro")).toBe("pro");
  });
});

const price = (id: string, amount: number) => ({
  id,
  amount,
  currency: "usd",
  amounts: { usd: amount },
});

const pricing = {
  monthly: price("price_new_m", 1000),
  yearly: price("price_new_y", 8400),
  currencies: { usd: { monthly: 1000, yearly: 8400 } },
  earlySupporter: {
    monthly: price("price_old_m", 700),
    yearly: price("price_old_y", 5600),
  },
};

describe("isEarlySupporter", () => {
  it("is false for a subscription on a current price", () => {
    expect(isEarlySupporter({ priceId: "price_new_m", pricing })).toBe(false);
    expect(isEarlySupporter({ priceId: "price_new_y", pricing })).toBe(false);
  });

  it("is true for a subscription on an early supporter price", () => {
    expect(isEarlySupporter({ priceId: "price_old_y", pricing })).toBe(true);
  });

  it("is true for a subscription on an older price with no lookup key", () => {
    expect(isEarlySupporter({ priceId: "price_2022_y", pricing })).toBe(true);
  });

  it("is false before the rollout when there are no early supporter prices", () => {
    expect(
      isEarlySupporter({
        priceId: "price_2022_y",
        pricing: { ...pricing, earlySupporter: undefined },
      }),
    ).toBe(false);
  });

  it("is false when pricing could not be loaded", () => {
    expect(isEarlySupporter({ priceId: "price_old_y", pricing: null })).toBe(
      false,
    );
  });
});

describe("resolvePriceSet", () => {
  it("returns the early supporter pair for early supporters", () => {
    expect(resolvePriceSet({ earlySupporter: true, pricing })).toEqual(
      pricing.earlySupporter,
    );
  });

  it("returns the current pair otherwise, and when early supporter prices are missing", () => {
    expect(resolvePriceSet({ earlySupporter: false, pricing })).toEqual({
      monthly: pricing.monthly,
      yearly: pricing.yearly,
    });
    expect(
      resolvePriceSet({
        earlySupporter: true,
        pricing: { ...pricing, earlySupporter: undefined },
      }),
    ).toEqual({ monthly: pricing.monthly, yearly: pricing.yearly });
  });
});

describe("formatMinorUnitAmount", () => {
  it("formats minor units as a localized currency string", () => {
    expect(
      formatMinorUnitAmount({ amount: 5600, currency: "usd", locale: "en" }),
    ).toBe("$56");
  });

  it("keeps cents when the amount needs them", () => {
    expect(
      formatMinorUnitAmount({ amount: 467, currency: "usd", locale: "en" }),
    ).toBe("$4.67");
  });

  it("does not scale zero decimal currencies", () => {
    expect(
      formatMinorUnitAmount({ amount: 5600, currency: "jpy", locale: "en" }),
    ).toBe("¥5,600");
  });
});
