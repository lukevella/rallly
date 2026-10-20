import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PollProvider } from "@/features/poll/client";
import { FinalizePollDialog } from "@/features/poll/components/finalize-poll-dialog";
import type { PollDetails, PollParticipant } from "@/features/poll/types";
import { render, screen } from "@/test/test-utils";

const mutate = vi.hoisted(() => vi.fn());

vi.mock("@rallly/posthog/client", () => ({
  posthog: { capture: vi.fn() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/features/user/client", () => ({
  useUser: () => ({ user: { id: "host" } }),
}));

vi.mock("@/features/billing/client", () => ({
  primePayWall: vi.fn(),
  usePayWallStore: () => null,
}));

vi.mock("@/features/billing/components/pay-wall-dialog", () => ({
  PayWallDialog: () => null,
}));

vi.mock("@/trpc/client", () => ({
  trpc: {
    polls: {
      book: { useMutation: () => ({ mutate, isPending: false }) },
    },
  },
}));

beforeEach(() => {
  mutate.mockReset();
});

const poll: PollDetails = {
  id: "poll-1",
  title: "Test poll",
  location: null,
  conferencing: null,
  description: null,
  createdAt: new Date("2026-10-01T00:00:00Z"),
  status: "open",
  closedReason: null,
  hideParticipants: false,
  disableComments: true,
  allowTentativeVotes: true,
  hideScores: false,
  requireParticipantEmail: false,
  muted: false,
  timeZone: null,
  userId: "host",
  spaceId: null,
  options: [
    {
      id: "option-1",
      startTime: new Date("2026-11-02T00:00:00Z"),
      duration: 0,
      maxParticipants: null,
    },
  ],
  user: null,
  space: null,
  event: null,
  inviteLink: "http://localhost:3000/invite/poll-1",
};

const participant: PollParticipant = {
  id: "participant-1",
  name: "Jessie Smith",
  email: "jessie@example.com",
  userId: null,
  note: null,
  image: null,
  createdAt: new Date("2026-10-01T00:00:00Z"),
  votes: [{ optionId: "option-1", type: "yes" }],
  hidden: false,
  editUrl: null,
};

/** Opens the finalize dialog as the host of the given poll. */
function renderDialog({
  pollOverrides,
  participants,
}: {
  pollOverrides: Partial<PollDetails>;
  participants: PollParticipant[];
}) {
  return render(
    <PollProvider
      poll={{ ...poll, ...pollOverrides }}
      participants={participants}
      comments={[]}
      viewerRole="admin"
    >
      <FinalizePollDialog open={true} />
    </PollProvider>,
  );
}

const aggregatePoll: Partial<PollDetails> = {
  aggregateResultsOnly: true,
  aggregateParticipantCount: 3,
  aggregateVotes: [
    { optionId: "option-1", yes: 2, ifNeedBe: 1, no: 0, skip: 0 },
  ],
};

/** Picks the only date, landing on the step that follows it. */
async function pickDate(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /2026/ }));
}

describe("FinalizePollDialog", () => {
  it("notifies every respondent of an aggregate results poll by default", async () => {
    const user = userEvent.setup();
    renderDialog({ pollOverrides: aggregatePoll, participants: [] });

    await pickDate(user);
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.queryByText("Jessie Smith")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(
      screen.getByRole("button", { name: "Finalize and notify participants" }),
    );

    expect(mutate).toHaveBeenCalledWith({
      pollId: "poll-1",
      optionId: "option-1",
      notifyParticipantIds: [],
      notifyAllParticipants: true,
    });
  });

  it("lets the host of an aggregate results poll notify no one", async () => {
    const user = userEvent.setup();
    renderDialog({ pollOverrides: aggregatePoll, participants: [] });

    await pickDate(user);
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Finalize" }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ notifyAllParticipants: false }),
    );
  });

  it("skips the notify step when an aggregate results poll has no responses", async () => {
    const user = userEvent.setup();
    renderDialog({
      pollOverrides: { ...aggregatePoll, aggregateParticipantCount: 0 },
      participants: [],
    });

    await pickDate(user);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Finalize" }));

    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({ notifyAllParticipants: false }),
    );
  });

  it("keeps the per-participant selection on other polls", async () => {
    const user = userEvent.setup();
    renderDialog({ pollOverrides: {}, participants: [participant] });

    await pickDate(user);
    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: /Finalize/ }));

    expect(mutate).toHaveBeenCalledWith({
      pollId: "poll-1",
      optionId: "option-1",
      notifyParticipantIds: ["participant-1"],
      notifyAllParticipants: false,
    });
  });
});
