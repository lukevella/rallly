import { toast } from "@rallly/ui/sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@/test/test-utils";
import { DuplicateDialog } from "./duplicate-dialog";

const billing = vi.hoisted(() => ({ trialState: "eligible", hasSpace: true }));

const trialAction = vi.hoisted(() => ({
  options: undefined as { onSuccess?: (args: unknown) => void } | undefined,
}));

const formatDateTime = vi.hoisted(() => vi.fn(() => "October 24"));

vi.mock("@rallly/ui/sonner", () => ({
  toast: { success: vi.fn() },
}));

vi.mock("@/lib/datetime/client", () => ({
  useDateTime: () => ({ formatDateTime }),
}));

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
  useTrial: () => ({ hasSpace: billing.hasSpace }),
  useIsFree: () => true,
  useProMonthlyPrice: () => "$7",
}));

vi.mock("@/features/billing/trial/actions", () => ({
  startTrial: vi.fn(),
}));

vi.mock("@/lib/safe-action/client", () => ({
  useSafeAction: (
    _action: unknown,
    options?: { onSuccess?: (args: unknown) => void },
  ) => {
    trialAction.options = options;
    return { executeAsync: vi.fn(), isExecuting: false };
  },
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
    billing.hasSpace = true;
  });

  it("offers a guest the login back to this poll, never the trial", () => {
    billing.trialState = "none";
    billing.hasSpace = false;
    renderDialog();
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login?redirectTo=%2Fpoll%2Fabc",
    );
    expect(screen.queryByText(/14 free days/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^duplicate/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
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

  it("confirms the start with the product's toast, carrying the end date", () => {
    renderDialog();
    const endsAt = new Date("2026-10-24T12:00:00Z");
    trialAction.options?.onSuccess?.({ data: { endsAt } });
    expect(formatDateTime).toHaveBeenCalledWith(endsAt, "monthDay");
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Your 14 free days of Pro started, free until"),
    );
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
