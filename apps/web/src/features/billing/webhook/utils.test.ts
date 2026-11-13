import type { Stripe } from "@rallly/billing";
import { describe, expect, it } from "vitest";
import {
  getApiPollAddonColumns,
  getSubscriptionDetails,
  hasUnreadableApiPollAddon,
  isActivationEvent,
  toSubscriptionRow,
} from "@/features/billing/webhook/utils";

function subscriptionEvent({
  type,
  status,
  previousStatus,
}: {
  type: "customer.subscription.created" | "customer.subscription.updated";
  status: Stripe.Subscription.Status;
  previousStatus?: Stripe.Subscription.Status;
}) {
  return {
    type,
    data: {
      object: { status },
      ...(previousStatus
        ? { previous_attributes: { status: previousStatus } }
        : {}),
    },
  } as unknown as Stripe.Event;
}

describe("isActivationEvent", () => {
  it("treats a subscription created active as the start", () => {
    expect(
      isActivationEvent(
        subscriptionEvent({
          type: "customer.subscription.created",
          status: "active",
        }),
      ),
    ).toBe(true);
  });

  it("ignores a subscription created incomplete", () => {
    expect(
      isActivationEvent(
        subscriptionEvent({
          type: "customer.subscription.created",
          status: "incomplete",
        }),
      ),
    ).toBe(false);
  });

  it("treats an update from incomplete to active as the start", () => {
    expect(
      isActivationEvent(
        subscriptionEvent({
          type: "customer.subscription.updated",
          status: "active",
          previousStatus: "incomplete",
        }),
      ),
    ).toBe(true);
  });

  it("ignores an incomplete subscription that expires", () => {
    expect(
      isActivationEvent(
        subscriptionEvent({
          type: "customer.subscription.updated",
          status: "incomplete_expired",
          previousStatus: "incomplete",
        }),
      ),
    ).toBe(false);
  });

  it("ignores updates that do not change the status", () => {
    expect(
      isActivationEvent(
        subscriptionEvent({
          type: "customer.subscription.updated",
          status: "active",
        }),
      ),
    ).toBe(false);
  });

  it("ignores recovery from past due", () => {
    expect(
      isActivationEvent(
        subscriptionEvent({
          type: "customer.subscription.updated",
          status: "active",
          previousStatus: "past_due",
        }),
      ),
    ).toBe(false);
  });
});

describe("getSubscriptionDetails", () => {
  const seat = {
    id: "si_seat",
    price: {
      id: "price_seat",
      unit_amount: 700,
      metadata: {},
      recurring: { interval: "month" },
      currency_options: { eur: { unit_amount: 650 } },
    },
  };
  const addon = {
    id: "si_addon",
    price: {
      id: "price_addon",
      unit_amount: 500,
      metadata: { addon: "api", api_poll_tier: "large" },
      recurring: { interval: "year" },
      currency_options: { eur: { unit_amount: 450 } },
    },
  };

  function subscription(items: unknown[]) {
    return {
      id: "sub_1",
      currency: "eur",
      items: { data: items },
    } as unknown as Stripe.Subscription;
  }

  it("gives the seat details on a single item subscription", () => {
    expect(getSubscriptionDetails(subscription([seat]))).toEqual({
      interval: "month",
      currency: "eur",
      amount: 650,
      priceId: "price_seat",
      discountPercentOff: null,
      discountAmountOff: null,
    });
  });

  it("gives the seat details when the add-on is listed first", () => {
    expect(getSubscriptionDetails(subscription([addon, seat]))).toEqual(
      getSubscriptionDetails(subscription([seat])),
    );
  });

  it("throws when there is no seat item", () => {
    expect(() => getSubscriptionDetails(subscription([addon]))).toThrow();
  });
});

describe("toSubscriptionRow", () => {
  const seat = {
    id: "si_seat",
    quantity: 3,
    price: {
      id: "price_seat",
      unit_amount: 700,
      metadata: {},
      recurring: { interval: "month" },
      currency_options: { eur: { unit_amount: 650 } },
    },
  };
  const addon = {
    id: "si_addon",
    quantity: 1,
    price: {
      id: "price_addon",
      unit_amount: 9000,
      metadata: { addon: "api", api_poll_tier: "large" },
      recurring: { interval: "month" },
      currency_options: { eur: { unit_amount: 8000 } },
    },
  };

  function subscription(items: unknown[]) {
    return {
      id: "sub_1",
      currency: "eur",
      items: { data: items },
    } as unknown as Stripe.Subscription;
  }

  const seatColumns = {
    interval: "month",
    currency: "eur",
    amount: 650,
    priceId: "price_seat",
    discountPercentOff: null,
    discountAmountOff: null,
    subscriptionItemId: "si_seat",
    quantity: 3,
  };

  it("writes null add-on columns for a seat only subscription", () => {
    expect(toSubscriptionRow(subscription([seat]))).toEqual({
      ...seatColumns,
      apiAddonItemId: null,
      apiAddonPriceId: null,
      apiAddonAmount: null,
      apiAddonTier: null,
    });
  });

  it.each([
    ["seat first", [seat, addon]],
    ["add-on first", [addon, seat]],
  ])("keeps the seat and reads the add-on with the %s", (_, items) => {
    expect(toSubscriptionRow(subscription(items))).toEqual({
      ...seatColumns,
      apiAddonItemId: "si_addon",
      apiAddonPriceId: "price_addon",
      apiAddonAmount: 8000,
      apiAddonTier: "large",
    });
  });
});

describe("hasUnreadableApiPollAddon", () => {
  const seat = { id: "si_seat", price: { id: "price_seat", metadata: {} } };

  function subscription(items: unknown[]) {
    return {
      id: "sub_1",
      currency: "usd",
      items: { data: items },
    } as unknown as Stripe.Subscription;
  }

  it("is false without an add-on item", () => {
    expect(hasUnreadableApiPollAddon(subscription([seat]))).toBe(false);
  });

  it("is false for a readable add-on", () => {
    const addon = {
      id: "si_addon",
      price: {
        id: "price_addon",
        unit_amount: 3000,
        metadata: { addon: "api", api_poll_tier: "small" },
      },
    };
    expect(hasUnreadableApiPollAddon(subscription([seat, addon]))).toBe(false);
  });

  it.each([
    ["an unknown tier", { addon: "api", api_poll_tier: "huge" }],
    ["only a limit", { addon: "api", api_poll_limit: "250" }],
  ])("is true when the add-on has %s", (_, metadata) => {
    const addon = {
      id: "si_addon",
      price: { id: "price_addon", unit_amount: 3000, metadata },
    };
    const sub = subscription([seat, addon]);
    expect(hasUnreadableApiPollAddon(sub)).toBe(true);
    expect(getApiPollAddonColumns(sub).apiAddonTier).toBeNull();
  });
});
