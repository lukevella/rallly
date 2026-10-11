import { toast } from "@rallly/ui/sonner";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@/test/test-utils";
import { SharePage } from "./share-page";

const billing = vi.hoisted(() => ({
  tier: "hobby",
  trialState: "eligible",
  trialEndsAt: null as Date | null,
}));

const trialAction = vi.hoisted(() => ({
  execute: vi.fn(),
  options: undefined as { onSuccess?: (args: unknown) => void } | undefined,
}));

vi.mock("@rallly/posthog/client", () => ({
  posthog: { capture: vi.fn() },
}));

vi.mock("@rallly/ui/sonner", () => ({
  toast: { success: vi.fn() },
}));

const formatDateTime = vi.hoisted(() => vi.fn(() => "October 24"));

const visit = vi.hoisted(() => ({ created: true }));

const pollState = vi.hoisted(() => ({ status: "open" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(visit.created ? "created" : ""),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/poll/abc/share",
}));

vi.mock("@/features/poll/client", () => ({
  usePoll: () => ({
    id: "abc",
    title: "Team offsite",
    inviteLink: "http://localhost/invite/abc",
    status: pollState.status,
  }),
}));

vi.mock("@/features/user/client", () => ({
  useUser: () => ({ user: { id: "u1", isGuest: false, name: "Yana" } }),
}));

vi.mock("@/features/billing/client", () => ({
  useTier: () => billing.tier,
  useTrial: () => ({
    trialStartedAt: null,
    trialEndsAt: billing.trialEndsAt,
    subscriptionActive: false,
  }),
  useTrialState: () => billing.trialState,
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
    return { execute: trialAction.execute, isExecuting: false };
  },
}));

vi.mock("@/lib/datetime/client", () => ({
  useDateTime: () => ({ formatDateTime }),
}));

// The pieces of step two are each tested on their own; stand-ins keep this
// file about the steps and the routes.
vi.mock("@/features/billing/components/upgrade-button", () => ({
  UpgradeButton: ({ children }: { children: React.ReactNode }) => (
    <button type="button">{children}</button>
  ),
}));
vi.mock("@/features/poll/components/invite-by-email", () => ({
  InviteByEmail: () => <div>invite by email</div>,
}));
vi.mock("@/features/poll/components/invite-email-preview", () => ({
  InviteEmailPreview: () => null,
}));
vi.mock("@/features/poll/components/invite-link-row", () => ({
  InviteLinkRow: () => <div>invite link</div>,
}));
vi.mock("@/features/poll/components/share-settings", () => ({
  SharePollSettings: () => <div>sharing settings</div>,
}));

function pickRoute(index: 0 | 1) {
  return screen.getAllByRole("radio")[index];
}

// ICU interpolation isn't wired up in this render harness, so copy with
// placeholders renders its raw template.
describe("SharePage", () => {
  beforeEach(() => {
    billing.tier = "hobby";
    billing.trialState = "eligible";
    billing.trialEndsAt = null;
    visit.created = true;
    pollState.status = "open";
    trialAction.execute.mockClear();
  });

  it("never offers the trial on a closed poll: the Free screen, no way to Pro", () => {
    pollState.status = "closed";
    render(<SharePage hasInvites={false} />);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText("invite link")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", {
        name: "Try Pro free for 14 days instead",
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/14 days/)).not.toBeInTheDocument();
    expect(trialAction.execute).not.toHaveBeenCalled();
  });

  it("opens a closed Pro poll on its share screen, with no trial offer", () => {
    pollState.status = "scheduled";
    billing.tier = "pro";
    billing.trialState = "trial";
    billing.trialEndsAt = new Date("2026-10-24T12:00:00Z");
    render(<SharePage hasInvites={false} />);
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
    expect(screen.getByText("invite by email")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /start 14 free days/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the sharing settings on the creation visit, on both routes", async () => {
    const user = userEvent.setup();
    billing.tier = "pro";
    billing.trialState = "trial";
    const { unmount } = render(<SharePage hasInvites={false} />);
    expect(screen.getByText("sharing settings")).toBeInTheDocument();
    unmount();

    billing.tier = "hobby";
    billing.trialState = "eligible";
    render(<SharePage hasInvites={false} />);
    await user.click(pickRoute(0));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("sharing settings")).toBeInTheDocument();
  });

  it("is sharing alone on a later visit through the Share button, on both routes", async () => {
    const user = userEvent.setup();
    visit.created = false;
    billing.tier = "pro";
    billing.trialState = "trial";
    const { unmount } = render(<SharePage hasInvites={false} />);
    expect(screen.getByText("invite by email")).toBeInTheDocument();
    expect(screen.queryByText("sharing settings")).not.toBeInTheDocument();
    unmount();

    billing.tier = "hobby";
    billing.trialState = "eligible";
    render(<SharePage hasInvites={false} />);
    expect(screen.getByText("How should it reach people?")).toBeInTheDocument();
    await user.click(pickRoute(0));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("invite link")).toBeInTheDocument();
    expect(screen.queryByText("sharing settings")).not.toBeInTheDocument();
  });

  it("asks how the poll should reach people, with no button until a card is picked", () => {
    render(<SharePage hasInvites={false} />);
    expect(
      screen.getByText("Poll created. How should it reach people?"),
    ).toBeInTheDocument();
    expect(screen.getByText("14 days free")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("starts the 14 free days when Pro is chosen, then shows the Pro share screen", async () => {
    const user = userEvent.setup();
    render(<SharePage hasInvites={false} />);

    await user.click(pickRoute(1));
    await user.click(
      screen.getByRole("button", { name: "Continue and start 14 free days" }),
    );
    expect(trialAction.execute).toHaveBeenCalledTimes(1);
    expect(trialAction.execute).toHaveBeenCalledWith({ source: "share" });
    expect(screen.queryByText("invite by email")).not.toBeInTheDocument();

    const endsAt = new Date("2026-10-24T12:00:00Z");
    act(() => {
      trialAction.options?.onSuccess?.({ data: { endsAt } });
    });
    expect(screen.getByText("invite by email")).toBeInTheDocument();
    // The product's own success toast confirms the start, with the end date.
    expect(formatDateTime).toHaveBeenCalledWith(endsAt, "monthDay");
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringContaining("Your 14 free days of Pro started, free until"),
    );
  });

  it("goes to the Free share screen without starting anything, and can cross to Pro", async () => {
    const user = userEvent.setup();
    render(<SharePage hasInvites={false} />);

    await user.click(pickRoute(0));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(trialAction.execute).not.toHaveBeenCalled();
    expect(screen.getByText("invite link")).toBeInTheDocument();
    expect(screen.queryByText("invite by email")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Try Pro free for 14 days instead" }),
    );
    expect(pickRoute(1)).toBeChecked();
    expect(
      screen.getByRole("button", { name: "Continue and start 14 free days" }),
    ).toBeInTheDocument();
  });

  it("opens on the Pro share screen while the trial runs", () => {
    billing.tier = "pro";
    billing.trialState = "trial";
    billing.trialEndsAt = new Date("2026-10-24T12:00:00Z");
    render(<SharePage hasInvites={false} />);
    expect(screen.getByText("invite by email")).toBeInTheDocument();
    expect(screen.getByText("Pro, free until {date}")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("opens on the Pro share screen when invites exist, so the sent list is reachable", () => {
    render(<SharePage hasInvites={true} />);
    expect(screen.getByText("invite by email")).toBeInTheDocument();
    expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  });

  it("after the trial, step one carries the price and Continue becomes the upgrade", async () => {
    const user = userEvent.setup();
    billing.trialState = "ended";
    billing.trialEndsAt = new Date("2026-10-24T12:00:00Z");
    render(<SharePage hasInvites={false} />);

    expect(screen.getByText("{price} a month")).toBeInTheDocument();
    expect(
      screen.getByText("Your 14 free days ended on {date}."),
    ).toBeInTheDocument();
    await user.click(pickRoute(1));
    expect(
      screen.getByRole("button", { name: "Upgrade to Pro, {price} a month" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Continue and start 14 free days" }),
    ).not.toBeInTheDocument();
  });
});
