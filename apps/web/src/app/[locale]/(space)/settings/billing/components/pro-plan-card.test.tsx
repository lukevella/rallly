import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";

import { ProPlanCard } from "./pro-plan-card";

// The card pulls in server actions and client-only hooks that aren't relevant
// to the price rendering under test, so stub them out.
vi.mock("@rallly/posthog/client", () => ({
  posthog: { capture: vi.fn() },
}));

vi.mock("@/features/billing/actions", () => ({
  openCustomerPortalAction: vi.fn(),
}));

vi.mock("@/lib/safe-action/client", () => ({
  useSafeAction: () => ({ execute: vi.fn(), isExecuting: false }),
}));

vi.mock("@/lib/datetime/client", () => ({
  useDateTimeConfig: () => ({ locale: "en" }),
  useDateTime: () => ({ formatDateTime: () => "Jan 1, 2026" }),
}));

vi.mock("./manage-seats-dialog", () => ({
  ManageSeatsDialog: () => null,
}));

const baseProps = {
  amount: 800,
  currency: "usd",
  interval: "month" as const,
  seats: 2,
  usedSeats: 1,
  status: "active" as const,
  cancelAtPeriodEnd: false,
  periodEnd: new Date("2026-01-01T00:00:00Z"),
  earlySupporter: false,
  listPrice: null,
};

describe("ProPlanCard", () => {
  // Note: ICU interpolation isn't wired up in this render harness, so the
  // discount note renders its raw template rather than an interpolated string.
  // The price figures come from Intl.NumberFormat, so those are asserted exactly.

  it("shows the full price when there is no discount", () => {
    render(<ProPlanCard {...baseProps} />);

    // amount (800) * seats (2) / 100 = $16.00, not struck through
    const price = screen.getByText("$16.00");
    expect(price).toBeInTheDocument();
    expect(price).not.toHaveClass("line-through");
    expect(screen.queryByText(/discount applied/)).not.toBeInTheDocument();
  });

  it("applies a percentage discount and shows the original price struck through", () => {
    render(<ProPlanCard {...baseProps} discountPercentOff={50} />);

    // Discounted total is shown as the headline price (16.00 - 50% = 8.00)
    expect(screen.getByText("$8.00")).toBeInTheDocument();
    // Original price is shown struck through
    expect(screen.getByText("$16.00")).toHaveClass("line-through");
    expect(screen.getByText(/discount applied/)).toBeInTheDocument();
  });

  it("applies a fixed-amount discount", () => {
    render(<ProPlanCard {...baseProps} discountAmountOff={400} />);

    // 1600 - 400 = 1200 -> $12.00
    expect(screen.getByText("$12.00")).toBeInTheDocument();
    expect(screen.getByText("$16.00")).toHaveClass("line-through");
    expect(screen.getByText(/discount applied/)).toBeInTheDocument();
  });

  it("labels early supporters and says the rate is kept", () => {
    render(<ProPlanCard {...baseProps} earlySupporter listPrice={null} />);

    expect(screen.getByText("Early supporter")).toBeInTheDocument();
    expect(document.querySelector(".line-through")).toBeNull();
  });

  it("shows nothing about early supporters on a current price", () => {
    render(<ProPlanCard {...baseProps} />);

    expect(screen.queryByText("Early supporter")).not.toBeInTheDocument();
  });

  it("keeps the badge when cancellation is scheduled", () => {
    render(
      <ProPlanCard
        {...baseProps}
        earlySupporter
        cancelAtPeriodEnd
        listPrice={{ monthly: 1000, yearly: 8400 }}
      />,
    );

    expect(screen.getByText("Early supporter")).toBeInTheDocument();
  });
});
