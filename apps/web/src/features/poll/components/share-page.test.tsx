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

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("created"),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/poll/abc/share",
}));

vi.mock("@/features/poll/client", () => ({
  usePoll: () => ({
    id: "abc",
    title: "Team offsite",
    inviteLink: "http://localhost/invite/abc",
    status: "open",
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
  useDateTime: () => ({ formatDateTime: () => "October 24" }),
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
    trialAction.execute.mockClear();
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
    expect(screen.queryByText("invite by email")).not.toBeInTheDocument();

    act(() => {
      trialAction.options?.onSuccess?.({ data: { endsAt: new Date() } });
    });
    expect(screen.getByText("invite by email")).toBeInTheDocument();
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
