import type { PollInviteStatus } from "@/features/poll/invite/utils";

export type PollInviteListItem = {
  id: string;
  email: string;
  status: PollInviteStatus;
  inviteUrl: string;
};

export type BallotVote = "yes" | "ifNeedBe" | "no";

/**
 * Everything the invite ballot needs that is the same for every viewer.
 * Carries no email, note or token, so it can be cached across viewers.
 */
export type BallotSource = {
  pollId: string;
  status: "open" | "closed" | "scheduled" | "canceled";
  timeZone: string | null;
  hideParticipants: boolean;
  hideScores: boolean;
  allowTentativeVotes: boolean;
  requireParticipantEmail: boolean;
  /** Ordered by start time. */
  options: { id: string; startTime: Date; duration: number }[];
  /** Newest first. */
  responses: {
    id: string;
    name: string;
    userId: string | null;
    createdAt: Date;
    votes: Record<string, BallotVote>;
  }[];
};

/** Who is looking: their session user and the responses their link names. */
export type BallotViewer = {
  userId: string | null;
  linkedResponseIds: string[];
};

export type BallotTallyEntry = {
  responseId: string;
  /** Null when the poll hides participants and the response is not the viewer's. */
  name: string | null;
  vote: "yes" | "ifNeedBe";
};

/** The ballot as one viewer may see it. */
export type Ballot = {
  pollId: string;
  timeZone: string | null;
  isDatePoll: boolean;
  allowTentativeVotes: boolean;
  requireParticipantEmail: boolean;
  canRespond: boolean;
  options: { id: string; startTime: string; duration: number }[];
  /** Null when the poll hides scores from this viewer. */
  tallies: Record<string, BallotTallyEntry[]> | null;
  /** How many responses the poll has, the bar each option is measured against. */
  responseCount: number;
  /** The response an edit link names first, then newest first. */
  ownResponses: {
    id: string;
    name: string;
    votes: Record<string, BallotVote>;
  }[];
};
