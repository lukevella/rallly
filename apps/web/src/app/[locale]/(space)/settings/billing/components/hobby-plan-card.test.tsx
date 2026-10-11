import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { HobbyPlanCard } from "./hobby-plan-card";

const billing = vi.hoisted(() => ({
  trialState: "eligible",
  trialEndsAt: null as Date | null,
  showPayWall: vi.fn(),
}));

const trialAction = vi.hoisted(() => ({ execute: vi.fn() }));

vi.mock("@/features/billing/client", () => ({
  showPayWall: billing.showPayWall,
  useTrialState: () => billing.trialState,
  useTrial: () => ({
    trialStartedAt: null,
    trialEndsAt: billing.trialEndsAt,
    subscriptionActive: false,
  }),
  useProMonthlyPrice: () => "$7",
}));

vi.mock("@/features/billing/trial/actions", () => ({
  startTrial: vi.fn(),
}));

vi.mock("@/lib/safe-action/client", () => ({
  useSafeAction: () => ({ execute: trialAction.execute, isExecuting: false }),
}));

vi.mock("@/lib/datetime/client", () => ({
  useDateTime: () => ({ formatDateTime: () => "October 24" }),
}));

vi.mock("@/features/billing/components/upgrade-button", () => ({
  UpgradeButton: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

// ICU interpolation isn't wired up in this render harness, so copy with
// placeholders renders its raw template.
describe("HobbyPlanCard", () => {
  beforeEach(() => {
    trialAction.execute.mockClear();
    billing.showPayWall.mockClear();
  });

  it("starts the 14 free days from Upgrade while the space is eligible", async () => {
    const user = userEvent.setup();
    billing.trialState = "eligible";
    render(<HobbyPlanCard />);

    expect(screen.getByText("Free for 14 days")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upgrade" }));
    expect(trialAction.execute).toHaveBeenCalledTimes(1);
    expect(billing.showPayWall).not.toHaveBeenCalled();
  });

  it("reads the end date and offers to keep Pro during the trial", () => {
    billing.trialState = "trial";
    billing.trialEndsAt = new Date("2026-10-24T12:00:00Z");
    render(<HobbyPlanCard />);

    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.getByText("Free until {date}.")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Keep Pro, {price} a month" }),
    ).toBeInTheDocument();
  });

  it("opens the plan window from Upgrade once the trial has ended, as before", async () => {
    const user = userEvent.setup();
    billing.trialState = "ended";
    render(<HobbyPlanCard />);

    expect(screen.queryByText("Free for 14 days")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Upgrade" }));
    expect(billing.showPayWall).toHaveBeenCalledWith({
      from: "billing-settings",
    });
    expect(trialAction.execute).not.toHaveBeenCalled();
  });
});
