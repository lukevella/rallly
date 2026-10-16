import type { Stripe } from "@rallly/billing";
import { describe, expect, it } from "vitest";
import { isActivationEvent } from "@/features/billing/webhook/utils";

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
