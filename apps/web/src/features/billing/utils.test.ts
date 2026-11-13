import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildSubscriptionUpdate,
  canChangeApiPollTier,
  classifyApiPollTierChange,
  isEarlySupporter,
  isStripeInvalidRequestError,
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

describe("isStripeInvalidRequestError", () => {
  it("matches the error Stripe returns for a currency conflict", () => {
    expect(
      isStripeInvalidRequestError({
        rawType: "invalid_request_error",
        code: null,
        param: null,
        message: "You cannot combine currencies on a single customer.",
      }),
    ).toBe(true);
  });

  it("ignores other errors", () => {
    expect(isStripeInvalidRequestError({ rawType: "api_error" })).toBe(false);
    expect(isStripeInvalidRequestError(new Error("boom"))).toBe(false);
    expect(isStripeInvalidRequestError(null)).toBe(false);
  });
});

const now = new Date("2026-11-13T12:00:00Z");
const tomorrow = new Date("2026-11-14T12:00:00Z");
const yesterday = new Date("2026-11-12T12:00:00Z");

describe("classifyApiPollTierChange", () => {
  const base = { retainedTier: null, retainedUntil: null, now };

  it("is none when the target matches the current limit", () => {
    expect(
      classifyApiPollTierChange({
        ...base,
        currentTier: "medium",
        targetTier: "medium",
      }),
    ).toBe("none");
    expect(
      classifyApiPollTierChange({
        ...base,
        currentTier: null,
        targetTier: null,
      }),
    ).toBe("none");
  });

  it("is an upgrade for a first purchase or a higher tier", () => {
    expect(
      classifyApiPollTierChange({
        ...base,
        currentTier: null,
        targetTier: "small",
      }),
    ).toBe("upgrade");
    expect(
      classifyApiPollTierChange({
        ...base,
        currentTier: "small",
        targetTier: "large",
      }),
    ).toBe("upgrade");
  });

  it("is a downgrade for a lower tier or a removal", () => {
    expect(
      classifyApiPollTierChange({
        ...base,
        currentTier: "medium",
        targetTier: "small",
      }),
    ).toBe("downgrade");
    expect(
      classifyApiPollTierChange({
        ...base,
        currentTier: "medium",
        targetTier: null,
      }),
    ).toBe("downgrade");
  });

  it("is a restore when going back up within a retained limit", () => {
    expect(
      classifyApiPollTierChange({
        currentTier: "small",
        retainedTier: "medium",
        retainedUntil: tomorrow,
        targetTier: "medium",
        now,
      }),
    ).toBe("restore");
    expect(
      classifyApiPollTierChange({
        currentTier: null,
        retainedTier: "large",
        retainedUntil: tomorrow,
        targetTier: "medium",
        now,
      }),
    ).toBe("restore");
  });

  it("is an upgrade above the retained limit or once it has expired", () => {
    expect(
      classifyApiPollTierChange({
        currentTier: "small",
        retainedTier: "medium",
        retainedUntil: tomorrow,
        targetTier: "large",
        now,
      }),
    ).toBe("upgrade");
    expect(
      classifyApiPollTierChange({
        currentTier: "small",
        retainedTier: "medium",
        retainedUntil: yesterday,
        targetTier: "medium",
        now,
      }),
    ).toBe("upgrade");
  });
});

describe("canChangeApiPollTier", () => {
  const subscription = {
    active: true,
    status: "active" as const,
    cancelAtPeriodEnd: false,
  };

  it("is true for an active subscription", () => {
    expect(canChangeApiPollTier(subscription)).toBe(true);
  });

  it("is false while past due or unpaid", () => {
    expect(canChangeApiPollTier({ ...subscription, status: "past_due" })).toBe(
      false,
    );
    expect(canChangeApiPollTier({ ...subscription, status: "unpaid" })).toBe(
      false,
    );
  });

  it("is false when the subscription cancels at period end", () => {
    expect(
      canChangeApiPollTier({ ...subscription, cancelAtPeriodEnd: true }),
    ).toBe(false);
  });
});

describe("buildSubscriptionUpdate", () => {
  const multiCurrencyPrice = (id: string, usd: number) => ({
    id,
    amount: usd,
    currency: "usd",
    amounts: { usd, eur: usd, gbp: usd },
  });

  const addonPrices = Object.fromEntries(
    (["small", "medium", "large", "xlarge"] as const).map((tier) => [
      tier,
      {
        monthly: multiCurrencyPrice(`price_api_${tier}_m`, 1),
        yearly: multiCurrencyPrice(`price_api_${tier}_y`, 10),
      },
    ]),
  ) as Record<
    "small" | "medium" | "large" | "xlarge",
    {
      monthly: ReturnType<typeof multiCurrencyPrice>;
      yearly: ReturnType<typeof multiCurrencyPrice>;
    }
  >;

  const prices = {
    pro: {
      monthly: multiCurrencyPrice("price_new_m", 1000),
      yearly: multiCurrencyPrice("price_new_y", 7200),
      earlySupporter: {
        monthly: multiCurrencyPrice("price_old_m", 700),
        yearly: multiCurrencyPrice("price_old_y", 5600),
      },
    },
    apiPollAddon: addonPrices,
  };

  const subscription = {
    currency: "usd",
    interval: "month" as const,
    quantity: 3,
    priceId: "price_new_m",
    subscriptionItemId: "si_seat",
    apiAddonItemId: null,
    apiAddonPriceId: null,
    apiAddonTier: null,
    apiPollRetainedTier: null,
    apiPollRetainedUntil: null,
    periodEnd: tomorrow,
  };

  const withAddon = {
    ...subscription,
    apiAddonItemId: "si_api",
    apiAddonPriceId: "price_api_medium_m",
    apiAddonTier: "medium" as const,
  };

  it("adds the add-on item on a first purchase and invoices at once", () => {
    expect(
      buildSubscriptionUpdate({
        subscription,
        change: { type: "api_tier", tier: "small" },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ price: "price_api_small_m" }],
      proration_behavior: "always_invoice",
      payment_behavior: "pending_if_incomplete",
    });
  });

  it("buys at the subscription's interval", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: { ...subscription, interval: "year" },
        change: { type: "api_tier", tier: "large" },
        prices,
        now,
      }),
    ).toMatchObject({ items: [{ price: "price_api_large_y" }] });
  });

  it("swaps the add-on price on an upgrade and invoices at once", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "api_tier", tier: "large" },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_api", price: "price_api_large_m" }],
      proration_behavior: "always_invoice",
      payment_behavior: "pending_if_incomplete",
    });
  });

  it("swaps the add-on price without proration on a downgrade", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "api_tier", tier: "small" },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_api", price: "price_api_small_m" }],
      proration_behavior: "none",
    });
  });

  it("removes the add-on in a call of its own without proration", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "api_tier", tier: null },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_api", deleted: true }],
      proration_behavior: "none",
    });
  });

  it("restores a retained tier without charging again", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: {
          ...withAddon,
          apiAddonPriceId: "price_api_small_m",
          apiAddonTier: "small" as const,
          apiPollRetainedTier: "medium" as const,
          apiPollRetainedUntil: tomorrow,
        },
        change: { type: "api_tier", tier: "medium" },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_api", price: "price_api_medium_m" }],
      proration_behavior: "none",
    });
  });

  it("re-adds a removed add-on within its retained period without charging", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: {
          ...subscription,
          apiPollRetainedTier: "medium" as const,
          apiPollRetainedUntil: tomorrow,
        },
        change: { type: "api_tier", tier: "medium" },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ price: "price_api_medium_m" }],
      proration_behavior: "none",
    });
  });

  it("treats an upgrade above the retained limit as a normal upgrade", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: {
          ...withAddon,
          apiAddonPriceId: "price_api_small_m",
          apiAddonTier: "small" as const,
          apiPollRetainedTier: "medium" as const,
          apiPollRetainedUntil: tomorrow,
        },
        change: { type: "api_tier", tier: "large" },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_api", price: "price_api_large_m" }],
      proration_behavior: "always_invoice",
      payment_behavior: "pending_if_incomplete",
    });
  });

  it("returns no_change for the current tier or removing a missing add-on", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "api_tier", tier: "medium" },
        prices,
        now,
      }),
    ).toEqual({ error: "no_change" });
    expect(
      buildSubscriptionUpdate({
        subscription,
        change: { type: "api_tier", tier: null },
        prices,
        now,
      }),
    ).toEqual({ error: "no_change" });
  });

  it("changes only the seat item's quantity and waits for payment", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "seats", seatDelta: 2 },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_seat", quantity: 5 }],
      proration_behavior: "always_invoice",
      payment_behavior: "pending_if_incomplete",
    });
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "seats", seatDelta: -1 },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_seat", quantity: 2 }],
      proration_behavior: "always_invoice",
      payment_behavior: "pending_if_incomplete",
    });
  });

  it("returns no_change for a zero seat delta", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "seats", seatDelta: 0 },
        prices,
        now,
      }),
    ).toEqual({ error: "no_change" });
  });

  it("moves both items to yearly prices, keeps the seat quantity and waits for payment", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "interval" },
        prices,
        now,
      }),
    ).toEqual({
      items: [
        { id: "si_seat", price: "price_new_y", quantity: 3 },
        { id: "si_api", price: "price_api_medium_y" },
      ],
      proration_behavior: "always_invoice",
      payment_behavior: "pending_if_incomplete",
    });
  });

  it("keeps early supporters on their own yearly seat price", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: { ...withAddon, priceId: "price_old_m" },
        change: { type: "interval" },
        prices,
        now,
      }),
    ).toMatchObject({
      items: [
        { id: "si_seat", price: "price_old_y", quantity: 3 },
        { id: "si_api", price: "price_api_medium_y" },
      ],
    });
  });

  it("moves only the seat item when there is no add-on", () => {
    expect(
      buildSubscriptionUpdate({
        subscription,
        change: { type: "interval" },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_seat", price: "price_new_y", quantity: 3 }],
      proration_behavior: "always_invoice",
      payment_behavior: "pending_if_incomplete",
    });
  });

  it("returns no_change when the subscription is already yearly", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: { ...withAddon, interval: "year" },
        change: { type: "interval" },
        prices,
        now,
      }),
    ).toEqual({ error: "no_change" });
  });

  it("refuses an add-on change in a currency the add-on has no price for", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: { ...subscription, currency: "sek" },
        change: { type: "api_tier", tier: "small" },
        prices,
        now,
      }),
    ).toEqual({ error: "currency_unsupported" });
  });

  it("refuses an interval switch when a yearly price lacks the currency", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: { ...withAddon, currency: "sek" },
        change: { type: "interval" },
        prices,
        now,
      }),
    ).toEqual({ error: "currency_unsupported" });
  });

  it("still removes the add-on in an unsupported currency", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: { ...withAddon, currency: "sek" },
        change: { type: "api_tier", tier: null },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_api", deleted: true }],
      proration_behavior: "none",
    });
  });

  it("switches to yearly by the stored tier", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "interval" },
        prices,
        now,
      }),
    ).toMatchObject({
      items: [
        { id: "si_seat", price: "price_new_y" },
        { id: "si_api", price: "price_api_medium_y" },
      ],
    });
  });

  it("falls back to the price id when the tier was never stored", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: { ...withAddon, apiAddonTier: null },
        change: { type: "interval" },
        prices,
        now,
      }),
    ).toMatchObject({
      items: [
        { id: "si_seat", price: "price_new_y" },
        { id: "si_api", price: "price_api_medium_y" },
      ],
    });
  });

  it("treats choosing the current tier as no change", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "api_tier", tier: "medium" },
        prices,
        now,
      }),
    ).toEqual({ error: "no_change" });
  });

  it("downgrades to a lower tier without charging", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: withAddon,
        change: { type: "api_tier", tier: "small" },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_api", price: "price_api_small_m" }],
      proration_behavior: "none",
    });
  });

  it("charges for a retained tier once the period has moved past it", () => {
    expect(
      buildSubscriptionUpdate({
        subscription: {
          ...withAddon,
          interval: "year",
          apiAddonPriceId: "price_api_small_y",
          apiAddonTier: "small" as const,
          apiPollRetainedTier: "medium" as const,
          apiPollRetainedUntil: tomorrow,
          periodEnd: new Date("2027-11-13T12:00:00Z"),
        },
        change: { type: "api_tier", tier: "medium" },
        prices,
        now,
      }),
    ).toEqual({
      items: [{ id: "si_api", price: "price_api_medium_y" }],
      proration_behavior: "always_invoice",
      payment_behavior: "pending_if_incomplete",
    });
  });
});
