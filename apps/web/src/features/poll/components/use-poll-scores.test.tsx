import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PollProvider, usePermissions } from "@/features/poll/client";
import PollOptions from "@/features/poll/components/mobile-poll/poll-options";
import { PollContextProvider } from "@/features/poll/components/poll-context";
import {
  useVisibility,
  useVisibleParticipants,
  VisibilityProvider,
} from "@/features/poll/components/visibility";
import {
  useVotingForm,
  VotingForm,
} from "@/features/poll/components/voting-form";
import type { PollDetails, PollParticipant } from "@/features/poll/types";
import { render, screen } from "@/test/test-utils";
import { usePollScores } from "./use-poll-scores";

const viewer = vi.hoisted(() => ({ userId: "" }));

vi.mock("@/features/user/client", () => ({
  /** The signed-in user the test sets in `viewer`, or none. */
  useUser: () => ({
    user: viewer.userId ? { id: viewer.userId } : undefined,
  }),
}));

beforeEach(() => {
  viewer.userId = "";
});

vi.mock("@/features/poll/components/mutations", () => ({
  normalizeVotes: () => [],
  useEditToken: () => undefined,
  useUpdateParticipantVotes: () => ({ execute: vi.fn() }),
}));

vi.mock("@/features/poll/components/new-participant-modal", () => ({
  NewParticipantForm: () => null,
}));

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
  userId: null,
  spaceId: null,
  options: [
    {
      id: "option-1",
      startTime: new Date("2026-11-01T00:00:00Z"),
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
  name: "Jessie",
  email: null,
  userId: null,
  note: null,
  image: null,
  createdAt: new Date("2026-10-01T00:00:00Z"),
  votes: [{ optionId: "option-1", type: "yes" }],
  hidden: false,
  editUrl: null,
};

/** Renders the first option's totals and the high score as JSON. */
function Scores() {
  const { getScore, highScore } = usePollScores();
  return (
    <output data-testid="scores">
      {JSON.stringify({ score: getScore("option-1"), highScore })}
    </output>
  );
}

describe("usePollScores", () => {
  it("counts individual votes for ordinary polls", () => {
    render(
      <PollProvider
        poll={poll}
        participants={[participant]}
        comments={[]}
        viewerRole="admin"
      >
        <Scores />
      </PollProvider>,
    );

    expect(JSON.parse(screen.getByTestId("scores").textContent ?? "")).toEqual({
      score: { yes: 1, ifNeedBe: 0, no: 0, skip: 0 },
      highScore: 1,
    });
  });

  /**
   * Renders what the voter sees of their own response as JSON, with a
   * button that cancels the voting form.
   */
  function PersonalVotes() {
    const form = useVotingForm();
    const { isOwnParticipant, canEditParticipant } = usePermissions();
    const { canSeeScores } = useVisibility();
    const participants = useVisibleParticipants();
    const { selectedParticipantId } = form;
    return (
      <>
        <output data-testid="personal-response">
          {JSON.stringify({
            selectedParticipantId,
            isOwn: isOwnParticipant(participant.id),
            canEdit: canEditParticipant(participant.id),
            canSeeScores,
            visibleIds: participants.map(({ id }) => id),
          })}
        </output>
        <button type="button" onClick={form.cancel}>
          Cancel editing
        </button>
        <PollOptions
          selectedParticipantId={selectedParticipantId}
          options={[
            {
              type: "date",
              optionId: "option-1",
              day: "1",
              dow: "Sun",
              month: "Nov",
              year: "2026",
              maxParticipants: null,
            },
          ]}
        />
      </>
    );
  }

  describe("personal votes alongside aggregate results", () => {
    it("does not grant access to another person's response or hidden trends", () => {
      render(
        <PollProvider
          poll={{
            ...poll,
            status: "closed",
            hideScores: true,
            aggregateResultsOnly: true,
          }}
          participants={[participant]}
          comments={[]}
          viewerRole="participant"
        >
          <PollContextProvider poll={poll}>
            <VisibilityProvider>
              <VotingForm>
                <PersonalVotes />
              </VotingForm>
            </VisibilityProvider>
          </PollContextProvider>
        </PollProvider>,
      );

      expect(
        JSON.parse(screen.getByTestId("personal-response").textContent ?? ""),
      ).toEqual({
        isOwn: false,
        canEdit: false,
        canSeeScores: false,
        visibleIds: [],
      });
      expect(screen.queryByTitle("Yes")).not.toBeInTheDocument();
    });

    it.each([
      { status: "open", signedIn: false },
      { status: "closed", signedIn: false },
      { status: "open", signedIn: true },
      { status: "closed", signedIn: true },
    ] as const)("shows personal votes and trends: %j", async ({
      status,
      signedIn,
    }) => {
      const user = userEvent.setup();
      viewer.userId = signedIn ? "user-1" : "";
      render(
        <PollProvider
          poll={{
            ...poll,
            status,
            hideScores: true,
            aggregateResultsOnly: true,
            aggregateParticipantCount: 10,
            aggregateVotes: [
              { optionId: "option-1", yes: 4, ifNeedBe: 3, no: 2, skip: 1 },
            ],
          }}
          participants={[
            { ...participant, userId: signedIn ? "user-1" : null },
          ]}
          linkedParticipantIds={signedIn ? [] : [participant.id]}
          comments={[]}
          viewerRole="participant"
        >
          <PollContextProvider poll={poll}>
            <VisibilityProvider>
              <VotingForm>
                <PersonalVotes />
              </VotingForm>
            </VisibilityProvider>
          </PollContextProvider>
        </PollProvider>,
      );

      expect(
        JSON.parse(screen.getByTestId("personal-response").textContent ?? ""),
      ).toEqual({
        selectedParticipantId: participant.id,
        isOwn: true,
        canEdit: status === "open",
        canSeeScores: true,
        visibleIds: [participant.id],
      });
      expect(screen.getByTitle("Yes")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /show participant votes/i }),
      ).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Cancel editing" }));
      expect(screen.getByTitle("Yes")).toBeInTheDocument();
      expect(screen.getByText("7")).toBeInTheDocument();
      expect(
        JSON.parse(screen.getByTestId("personal-response").textContent ?? "")
          .selectedParticipantId,
      ).toBe(participant.id);
    });
  });

  it.each([
    { aggregateResultsOnly: true, viewerRole: "admin", canSeeScores: true },
    {
      aggregateResultsOnly: true,
      viewerRole: "participant",
      canSeeScores: false,
    },
    { aggregateResultsOnly: false, viewerRole: "admin", canSeeScores: false },
  ] as const)("shows hidden scores to the aggregate host only: %j", ({
    aggregateResultsOnly,
    viewerRole,
    canSeeScores,
  }) => {
    function ScoreVisibility() {
      return (
        <output data-testid="visibility">
          {String(useVisibility().canSeeScores)}
        </output>
      );
    }

    render(
      <PollProvider
        poll={{ ...poll, hideScores: true, aggregateResultsOnly }}
        participants={[]}
        comments={[]}
        viewerRole={viewerRole}
      >
        <VisibilityProvider>
          <ScoreVisibility />
        </VisibilityProvider>
      </PollProvider>,
    );

    expect(screen.getByTestId("visibility").textContent).toBe(
      String(canSeeScores),
    );
  });

  it.each([
    { participants: [] },
    { participants: [participant] },
  ])("uses aggregate counts without needing or double-counting individual responses: %j", ({
    participants,
  }) => {
    render(
      <PollProvider
        poll={{
          ...poll,
          aggregateResultsOnly: true,
          aggregateParticipantCount: 10,
          aggregateVotes: [
            { optionId: "option-1", yes: 4, ifNeedBe: 3, no: 2, skip: 1 },
          ],
        }}
        participants={participants}
        comments={[]}
        viewerRole="admin"
      >
        <Scores />
      </PollProvider>,
    );

    expect(JSON.parse(screen.getByTestId("scores").textContent ?? "")).toEqual({
      score: { yes: 4, ifNeedBe: 3, no: 2, skip: 1 },
      highScore: 7,
    });
  });
});
