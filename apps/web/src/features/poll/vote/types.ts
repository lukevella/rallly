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
    event: { id: string; start: Date; duration: number } | null;
  };
  results: VoteResult[];
  response: VoteResponse | null;
  /** False once the poll is closed or scheduled. */
  canVote: boolean;
};
