import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { TrialProBadge } from "./pro-badge";

const trialState = vi.hoisted(() => ({ value: "eligible" }));

vi.mock("@/features/billing/client", () => ({
  useTrialState: () => trialState.value,
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

  it("reads Pro once the trial has ended", () => {
    trialState.value = "ended";
    render(<TrialProBadge />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });
});
