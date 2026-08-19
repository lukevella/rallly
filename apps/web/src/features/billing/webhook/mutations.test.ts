import type { Stripe } from "@rallly/billing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleStripeWebhookEvent } from "./mutations";

const {
  mockSpaceFindUnique,
  mockSpaceUpdate,
  mockSubscriptionFindFirst,
  mockSubscriptionUpdateMany,
  mockSubscriptionUpsert,
  mockSpaceMemberInviteDeleteMany,
  mockStripeRetrieve,
  mockStripeInvoiceList,
  mockStripeVoidInvoice,
  mockPosthogCapture,
  mockIdentifyGroup,
} = vi.hoisted(() => ({
  mockSpaceFindUnique: vi.fn(),
  mockSpaceUpdate: vi.fn(),
  mockSubscriptionFindFirst: vi.fn(),
  mockSubscriptionUpdateMany: vi.fn(),
  mockSubscriptionUpsert: vi.fn(),
  mockSpaceMemberInviteDeleteMany: vi.fn(),
  mockStripeRetrieve: vi.fn(),
  mockStripeInvoiceList: vi.fn(),
  mockStripeVoidInvoice: vi.fn(),
  mockPosthogCapture: vi.fn(),
  mockIdentifyGroup: vi.fn(),
}));

vi.mock("@rallly/database", () => {
  const tx = {
    subscription: {
      findFirst: mockSubscriptionFindFirst,
      updateMany: mockSubscriptionUpdateMany,
      upsert: mockSubscriptionUpsert,
    },
    space: {
      update: mockSpaceUpdate,
    },
    spaceMemberInvite: {
      deleteMany: mockSpaceMemberInviteDeleteMany,
    },
  };
  return {
    prisma: {
      ...tx,
      space: {
        ...tx.space,
        findUnique: mockSpaceFindUnique,
      },
      $transaction: (fn: (tx: unknown) => Promise<unknown>) => fn(tx),
    },
  };
});

vi.mock("@/features/billing/service", () => ({
  getStripe: () => ({
    subscriptions: { retrieve: mockStripeRetrieve },
    invoices: {
      list: mockStripeInvoiceList,
      voidInvoice: mockStripeVoidInvoice,
    },
  }),
}));

vi.mock("@/lib/posthog", () => ({
  posthog: () => ({ capture: mockPosthogCapture }),
  identifyGroup: mockIdentifyGroup,
}));

vi.mock("@/env", () => ({ env: { SUPPORT_EMAIL: "support@example.com" } }));
vi.mock("@rallly/emails", () => ({ sendRawEmail: vi.fn() }));
vi.mock("@rallly/emails/templates/license-key", () => ({
  sendLicenseKeyEmail: vi.fn(),
}));
vi.mock("@sentry/nextjs", () => ({
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/emails/branding", () => ({ getInstanceBranding: vi.fn() }));
vi.mock("@/features/licensing/mutations", () => ({ licenseManager: {} }));

const subscription = {
  id: "sub_1",
  status: "canceled",
  currency: "usd",
  created: 1700000000,
  current_period_start: 1700000000,
  current_period_end: 1702592000,
  cancel_at_period_end: false,
  metadata: { userId: "user_1", spaceId: "space_1" },
  items: {
    data: [
      {
        id: "si_1",
        quantity: 1,
        price: {
          id: "price_1",
          unit_amount: 700,
          recurring: { interval: "month" },
        },
      },
    ],
  },
  discount: null,
};

function subscriptionEvent(
  type:
    | "customer.subscription.created"
    | "customer.subscription.updated"
    | "customer.subscription.deleted",
) {
  return { type, data: { object: { id: "sub_1" } } } as Stripe.Event;
}

function givenSpaceIsDeleted() {
  mockSpaceFindUnique.mockResolvedValue(null);
  // Simulate what Postgres does when the row is gone
  mockSpaceUpdate.mockRejectedValue(
    Object.assign(new Error("Record to update not found."), {
      code: "P2025",
    }),
  );
  mockSubscriptionUpsert.mockRejectedValue(
    Object.assign(new Error("Foreign key constraint failed"), {
      code: "P2003",
    }),
  );
  mockSubscriptionUpdateMany.mockResolvedValue({ count: 0 });
  mockSubscriptionFindFirst.mockResolvedValue(null);
}

function givenSpaceExists() {
  mockSpaceFindUnique.mockResolvedValue({ id: "space_1" });
  mockSpaceUpdate.mockResolvedValue({ id: "space_1" });
  mockSubscriptionUpsert.mockResolvedValue({ id: "sub_1" });
  mockSubscriptionUpdateMany.mockResolvedValue({ count: 1 });
  mockSubscriptionFindFirst.mockResolvedValue(null);
  mockSpaceMemberInviteDeleteMany.mockResolvedValue({ count: 0 });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStripeRetrieve.mockResolvedValue(subscription);
  mockStripeInvoiceList.mockResolvedValue({ data: [] });
  mockSpaceMemberInviteDeleteMany.mockResolvedValue({ count: 0 });
});

describe("subscription webhooks for a deleted user/space", () => {
  it("treats customer.subscription.deleted as a no-op when the space is gone", async () => {
    givenSpaceIsDeleted();

    await expect(
      handleStripeWebhookEvent(
        subscriptionEvent("customer.subscription.deleted"),
      ),
    ).resolves.toEqual({ handled: true });

    expect(mockSpaceUpdate).not.toHaveBeenCalled();
    expect(mockIdentifyGroup).not.toHaveBeenCalled();
    expect(mockPosthogCapture).not.toHaveBeenCalled();
  });

  it("still voids open invoices when the space is gone", async () => {
    givenSpaceIsDeleted();
    mockStripeInvoiceList.mockResolvedValue({ data: [{ id: "in_1" }] });

    await handleStripeWebhookEvent(
      subscriptionEvent("customer.subscription.deleted"),
    );

    expect(mockStripeVoidInvoice).toHaveBeenCalledWith("in_1");
  });

  it("treats customer.subscription.updated as a no-op when the space is gone", async () => {
    givenSpaceIsDeleted();

    await expect(
      handleStripeWebhookEvent(
        subscriptionEvent("customer.subscription.updated"),
      ),
    ).resolves.toEqual({ handled: true });

    expect(mockSubscriptionUpsert).not.toHaveBeenCalled();
    expect(mockSpaceUpdate).not.toHaveBeenCalled();
  });

  it("treats customer.subscription.created as a no-op when the space is gone", async () => {
    givenSpaceIsDeleted();

    await expect(
      handleStripeWebhookEvent(
        subscriptionEvent("customer.subscription.created"),
      ),
    ).resolves.toEqual({ handled: true });

    expect(mockSubscriptionUpsert).not.toHaveBeenCalled();
    expect(mockSpaceUpdate).not.toHaveBeenCalled();
  });
});

describe("subscription webhooks for an existing space", () => {
  it("deactivates the subscription and downgrades the space on customer.subscription.deleted", async () => {
    givenSpaceExists();

    await expect(
      handleStripeWebhookEvent(
        subscriptionEvent("customer.subscription.deleted"),
      ),
    ).resolves.toEqual({ handled: true });

    expect(mockSubscriptionUpdateMany).toHaveBeenCalledWith({
      where: { id: "sub_1" },
      data: { active: false, status: "canceled" },
    });
    expect(mockSpaceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "space_1" },
        data: expect.objectContaining({ tier: "hobby" }),
      }),
    );
  });
});
