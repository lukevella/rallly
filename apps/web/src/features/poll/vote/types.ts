import type { PollConferencing } from "@/features/conferencing/schema";
import type { VoteType } from "@/features/poll/constants";
import type { PollClosedReason, PollStatus } from "@/features/poll/schema";

/** One option with its tally. `score` is null when the poll hides scores. */
export type VoteResult = {
  optionId: string;
  startTime: Date;
  duration: number;
  score: { yes: number; ifNeedBe: number } | null;
};

/** The viewer's own response. */
export type VoteResponse = {
  participantId: string;
  name: string;
  image: string | null;
  votes: { optionId: string; type: VoteType }[];
};

/**
 * Everything the vote page renders, with visibility already resolved: a
 * hidden score is absent rather than filtered client side, and the viewer's
 * response is chosen here rather than derived from a participant list.
 */
export type VotePageView = {
  poll: {
    id: string;
    title: string;
    description: string | null;
    location: string | null;
    conferencing: PollConferencing | null;
    status: PollStatus;
    closedReason: PollClosedReason | null;
    allowTentativeVotes: boolean;
    timeZone: string | null;
    userId: string | null;
    spaceId: string | null;
    requireParticipantEmail: boolean;
    user: { name: string } | null;
    space: {
      name: string;
      image: string | null;
      showBranding: boolean;
      hideAttribution: boolean;
      primaryColor: string | null;
    } | null;
    event: {
      id: string;
      start: Date;
      duration: number;
      /** The minted meeting's link, once the poll is finalized. */
      conferencingUri: string | null;
    } | null;
  };
  results: VoteResult[];
  /** Denominator for the per-option tallies; null when scores are hidden. */
  participantCount: number | null;
  response: VoteResponse | null;
  /** False once the poll is closed or scheduled. */
  canVote: boolean;
};

/**
 * What every voting view receives. The votes being composed are not in
 * here: views read and write them through the form context, so switching
 * view keeps the selection.
 */
export type VoteViewProps = {
  poll: VotePageView["poll"];
  results: VoteResult[];
  participantCount: number | null;
  response: VoteResponse | null;
  canVote: boolean;
};

/** Which voting view is on screen. */
export type VoteViewId = "list" | "calendar" | "week";
