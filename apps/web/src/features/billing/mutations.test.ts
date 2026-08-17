import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCancel, mockFindMany } = vi.hoisted(() => ({
  mockCancel: vi.fn(),
  mockFindMany: vi.fn(),
}));

vi.mock("@rallly/database", () => ({
  prisma: { subscription: { findMany: mockFindMany } },
}));

vi.mock("@/features/billing/service", () => ({
  getStripe: () => ({ subscriptions: { cancel: mockCancel } }),
}));

vi.mock("@/features/billing/constants", () => ({ isBillingEnabled: true }));

import { cancelSubscriptionsById } from "./mutations";

describe("cancelSubscriptionsById", () => {
  beforeEach(() => {
    mockCancel.mockReset();
    mockFindMany.mockReset();
  });

  it("cancels every id it is given", async () => {
    mockCancel.mockResolvedValue({});

    await cancelSubscriptionsById({ subscriptionIds: ["sub_a", "sub_b"] });

    expect(mockCancel).toHaveBeenCalledTimes(2);
    expect(mockCancel).toHaveBeenCalledWith("sub_a");
    expect(mockCancel).toHaveBeenCalledWith("sub_b");
  });

  // Account deletion cancels by id precisely because the subscription rows
  // are already gone by then — this must never fall back to a database read.
  it("does not read the database", async () => {
    mockCancel.mockResolvedValue({});

    await cancelSubscriptionsById({ subscriptionIds: ["sub_a"] });

    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it("does nothing when there are no ids", async () => {
    await cancelSubscriptionsById({ subscriptionIds: [] });

    expect(mockCancel).not.toHaveBeenCalled();
  });
});
