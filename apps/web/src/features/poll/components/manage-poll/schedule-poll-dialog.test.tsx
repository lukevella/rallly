import { beforeEach, describe, expect, it, vi } from "vitest";
import { PollProvider } from "@/features/poll/client";
import type { PollDetails, PollParticipant } from "@/features/poll/types";
import { render, screen } from "@/test/test-utils";
import { SchedulePollDialog } from "./schedule-poll-dialog";

const billing = vi.hoisted(() => ({ trialState: "eligible" }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/poll/abc",
}));

vi.mock("@/trpc/client", () => ({
  trpc: {
    polls: {
      book: {
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

// The per-option score and bar read the legacy poll context the poll page
// mounts; the dialog's own buttons and lines are what is under test.
vi.mock("@/features/poll/components/score-summary", () => ({
  ConnectedScoreSummary: () => null,
}));

vi.mock("@/features/poll/components/vote-summary-progress-bar", () => ({
  VoteSummaryProgressBar: () => null,
}));

const poll = {
  id: "abc",
  title: "Team offsite",
  timeZone: null,
  allowTentativeVotes: true,
  options: [
    { id: "o1", startTime: new Date("2026-11-05T12:00:00Z"), duration: 120 },
  ],
} as unknown as PollDetails;

function participant(id: string, email: string | null): PollParticipant {
  return {
    id,
    name: id,
    email,
    userId: null,
    note: null,
    image: null,
    createdAt: new Date("2026-10-01T00:00:00Z"),
    votes: [{ optionId: "o1", type: "yes" }],
    hidden: false,
    editUrl: null,
  };
}

function renderDialog(participants: PollParticipant[]) {
  return render(
    <PollProvider
      poll={poll}
      participants={participants}
      comments={[]}
      viewerRole="admin"
    >
      <SchedulePollDialog open />
    </PollProvider>,
  );
}

// ICU interpolation isn't wired up in this render harness, so copy with
// placeholders renders its raw template.
describe("SchedulePollDialog", () => {
  beforeEach(() => {
    billing.trialState = "eligible";
  });

  it("names the trial in the button before one", () => {
    renderDialog([]);
    expect(
      screen.getByRole("button", { name: "Schedule and start 14 free days" }),
    ).toBeInTheDocument();
    expect(screen.getByText("trial terms")).toBeInTheDocument();
  });

  it("is the plain dialog while the trial runs", () => {
    billing.trialState = "trial";
    renderDialog([]);
    expect(
      screen.getByRole("button", { name: /^schedule$/i }),
    ).toBeInTheDocument();
  });

  it("goes to checkout after the trial, keeping Cancel", () => {
    billing.trialState = "ended";
    renderDialog([]);
    expect(
      screen.getByRole("button", { name: "Upgrade to Pro, {price} a month" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("says who the calendar invite will reach", () => {
    renderDialog([participant("a", "a@example.com"), participant("b", null)]);
    expect(
      screen.getByText(/{count} of {total} left one\./),
    ).toBeInTheDocument();
  });

  it("says when nobody left an email", () => {
    renderDialog([participant("b", null)]);
    expect(
      screen.getByText(
        /Nobody did on this poll, so you will tell them yourself\./,
      ),
    ).toBeInTheDocument();
  });
});
