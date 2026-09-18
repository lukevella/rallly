import { Dialog } from "@rallly/ui/dialog";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";

import { ProPlanCard } from "./pro-plan-card";

// The card pulls in server actions and client-only hooks that aren't relevant
// to the rendering under test, so stub them out.
vi.mock("@rallly/posthog/client", () => ({
  posthog: { capture: vi.fn() },
}));

vi.mock("@/features/billing/actions", () => ({
  switchToYearlyAction: vi.fn(),
  openBillingDetailsAction: vi.fn(),
  openCancelPlanAction: vi.fn(),
  openPaymentMethodUpdateAction: vi.fn(),
  resumePlanAction: vi.fn(),
}));

vi.mock("@/lib/safe-action/client", () => ({
  useSafeAction: () => ({ execute: vi.fn(), isExecuting: false }),
}));

vi.mock("@/lib/datetime/client", () => ({
  useDateTimeConfig: () => ({ locale: "en" }),
  useDateTime: () => ({ formatDateTime: () => "Jan 1, 2026" }),
}));

// The dialogs own a Dialog root around their trigger; stand-ins keep the root
// so the real DialogTrigger inside the card still mounts.
vi.mock("./manage-seats-dialog", () => ({
  ManageSeatsDialog: ({ children }: { children: React.ReactNode }) => (
    <Dialog>{children}</Dialog>
  ),
}));

vi.mock("./switch-to-yearly-dialog", () => ({
  SwitchToYearlyDialog: ({ children }: { children: React.ReactNode }) => (
    <Dialog>{children}</Dialog>
  ),
}));

const baseProps = {
  amount: 1000,
  currency: "usd",
  interval: "month" as const,
  seats: 1,
  usedSeats: 1,
  status: "active" as const,
  cancelAtPeriodEnd: false,
  periodEnd: new Date("2026-01-01T00:00:00Z"),
  earlySupporter: false,
  listPrice: null,
  switchToYearly: { monthlyAmount: 1000, yearlyAmount: 7200 },
  canResume: false,
};

// ICU interpolation isn't wired up in this render harness, so copy with
// placeholders renders its raw template. Assertions target formatted numbers
// rendered outside Trans, button names, and leading words.
describe("ProPlanCard", () => {
  it("shows the monthly total and the renewing actions", () => {
    render(<ProPlanCard {...baseProps} />);

    expect(screen.getByText("$10")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /switch to yearly/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /manage seats/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /cancel plan/i }),
    ).toBeInTheDocument();
    // Invoices live in the payment and billing card, which opens the same
    // portal, so the footer does not repeat the link.
    expect(
      screen.queryByRole("button", { name: /invoices/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /resume plan/i }),
    ).not.toBeInTheDocument();
  });

  it("shows the per month equivalent for yearly billing and no plan switch", () => {
    render(
      <ProPlanCard
        {...baseProps}
        interval="year"
        amount={7200}
        switchToYearly={null}
      />,
    );

    expect(screen.getByText("$6")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /switch to yearly/i }),
    ).not.toBeInTheDocument();
  });

  it("multiplies by seats and applies a percentage discount", () => {
    render(<ProPlanCard {...baseProps} seats={2} discountPercentOff={30} />);

    // 1000 × 2 = 2000, minus 30% = 1400 → $14
    expect(screen.getByText("$14")).toBeInTheDocument();
  });

  it("offers only resume once cancellation is scheduled", () => {
    render(
      <ProPlanCard
        {...baseProps}
        cancelAtPeriodEnd
        canResume
        switchToYearly={null}
      />,
    );

    expect(
      screen.getByRole("button", { name: /resume plan/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /switch to yearly/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /cancel plan/i }),
    ).not.toBeInTheDocument();
  });

  it("hides resume while the account is scheduled for deletion", () => {
    render(
      <ProPlanCard
        {...baseProps}
        cancelAtPeriodEnd
        canResume={false}
        switchToYearly={null}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /resume plan/i }),
    ).not.toBeInTheDocument();
  });

  it("asks for a payment method when past due", () => {
    render(<ProPlanCard {...baseProps} status="past_due" />);

    expect(
      screen.getByRole("button", { name: /update payment method/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /switch to yearly/i }),
    ).not.toBeInTheDocument();
  });

  it("labels early supporters", () => {
    render(<ProPlanCard {...baseProps} earlySupporter />);

    expect(screen.getByText("Early supporter")).toBeInTheDocument();
  });
});
