import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { DuplicateDialog } from "./duplicate-dialog";

const billing = vi.hoisted(() => ({ trialState: "eligible" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/poll/abc",
}));

vi.mock("@/trpc/client", () => ({
  trpc: {
    polls: {
      duplicate: {
        useMutation: () => ({ mutate: vi.fn(), isPending: false }),
      },
    },
  },
}));

vi.mock("@/features/billing/client", () => ({
  useTrialState: () => billing.trialState,
  useProMonthlyPrice: () => "$7",
}));

vi.mock("@/features/billing/trial/actions", () => ({
  startTrial: vi.fn(),
}));

vi.mock("@/lib/safe-action/client", () => ({
  useSafeAction: () => ({ executeAsync: vi.fn(), isExecuting: false }),
}));

vi.mock("@/features/billing/trial/components/trial-terms", () => ({
  TrialTerms: () => <div>trial terms</div>,
}));

vi.mock("@/features/billing/components/upgrade-button", () => ({
  UpgradeButton: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));

function renderDialog() {
  return render(<DuplicateDialog open pollId="abc" pollTitle="Team offsite" />);
}

// ICU interpolation isn't wired up in this render harness, so copy with
// placeholders renders its raw template.
describe("DuplicateDialog", () => {
  beforeEach(() => {
    billing.trialState = "eligible";
  });

  it("names the trial in the button before one", () => {
    renderDialog();
    expect(
      screen.getByRole("button", { name: "Duplicate and start 14 free days" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("is the plain dialog while the trial runs", () => {
    billing.trialState = "trial";
    renderDialog();
    expect(
      screen.getByRole("button", { name: /^duplicate$/i }),
    ).toBeInTheDocument();
  });

  it("goes to checkout after the trial, keeping Cancel", () => {
    billing.trialState = "ended";
    renderDialog();
    expect(
      screen.getByRole("button", { name: "Upgrade to Pro, {price} a month" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /duplicate/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });
});
