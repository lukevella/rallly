import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { TrialProBadge } from "./pro-badge";

const trialState = vi.hoisted(() => ({ value: "eligible", hasSpace: true }));

vi.mock("@/features/billing/client", () => ({
  useTrialState: () => trialState.value,
  useTrial: () => ({ hasSpace: trialState.hasSpace }),
  useIsFree: () => true,
}));

describe("TrialProBadge", () => {
  it("offers the 14 free days before a trial", () => {
    trialState.value = "eligible";
    render(<TrialProBadge />);
    expect(screen.getByText("Free for 14 days")).toBeInTheDocument();
  });

  it("shows nothing while the trial runs or the space pays", () => {
    trialState.value = "trial";
    const { container, rerender } = render(<TrialProBadge />);
    expect(container).toBeEmptyDOMElement();
    trialState.value = "paying";
    rerender(<TrialProBadge />);
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps the plain Pro for a guest organiser, who has no space to hold a trial", () => {
    trialState.value = "none";
    trialState.hasSpace = false;
    render(<TrialProBadge />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
    expect(screen.queryByText(/14 days/)).not.toBeInTheDocument();
    trialState.hasSpace = true;
  });

  it("reads Pro once the trial has ended", () => {
    trialState.value = "ended";
    render(<TrialProBadge />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });
});
