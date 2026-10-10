import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { TrialTerms } from "./trial-terms";

const billing = vi.hoisted(() => ({
  trialState: "eligible",
  trialEndsAt: null as Date | null,
}));

vi.mock("@/features/billing/client", () => ({
  useTrialState: () => billing.trialState,
  useTrial: () => ({
    trialStartedAt: null,
    trialEndsAt: billing.trialEndsAt,
    subscriptionActive: false,
  }),
  useProMonthlyPrice: () => "$7",
}));

vi.mock("@/lib/datetime/client", () => ({
  useDateTime: () => ({ formatDateTime: () => "October 24" }),
}));

// ICU interpolation isn't wired up in this render harness, so copy with
// placeholders renders its raw template; the placeholders are asserted.
describe("TrialTerms", () => {
  it("states the terms before a trial, naming the action", () => {
    billing.trialState = "eligible";
    render(<TrialTerms action="schedule" />);
    expect(screen.getByText("Scheduling is part of Pro.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "14 free days, no card, ends {date}. After that, {price} a month to keep Pro, or scheduling stops. Your poll and answers stay.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps the duplicate wording shorter", () => {
    billing.trialState = "eligible";
    render(<TrialTerms action="duplicate" />);
    expect(screen.getByText("Duplicating is part of Pro.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "14 free days, no card, ends {date}. After that, {price} a month to keep Pro.",
      ),
    ).toBeInTheDocument();
  });

  it("says when the trial ended, after it", () => {
    billing.trialState = "ended";
    billing.trialEndsAt = new Date("2026-10-24T12:00:00Z");
    render(<TrialTerms action="schedule" />);
    expect(
      screen.getByText("Your 14 free days ended on {date}."),
    ).toBeInTheDocument();
  });

  it("shows nothing while the trial runs", () => {
    billing.trialState = "trial";
    const { container } = render(<TrialTerms action="schedule" />);
    expect(container).toBeEmptyDOMElement();
  });
});
