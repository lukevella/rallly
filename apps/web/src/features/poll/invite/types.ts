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

/** Everyone's answers, with each person listed once however many options there are. */
export type BallotTallies = {
  /** Newest first. A name is null when the poll hides participants and the response is not the viewer's. */
  responses: { id: string; name: string | null }[];
  /** Per option, each response's answer in the order of `responses`; null where it has none. */
  votes: Record<string, (BallotVote | null)[]>;
};

/** A row of an option's breakdown. `viewer` marks the person looking at it. */
export type BallotBreakdownEntry = {
  responseId: string;
  name: string | null;
  vote: BallotVote;
  /** `unsaved` while their answer differs from the one on record. */
  viewer?: { unsaved: boolean };
};

/** The ballot as one viewer may see it. */
export type Ballot = {
  pollId: string;
  timeZone: string | null;
  isDatePoll: boolean;
  allowTentativeVotes: boolean;
  requireParticipantEmail: boolean;
  /** Other people's names are withheld, so there is no one to list. */
  hideParticipants: boolean;
  canRespond: boolean;
  options: { id: string; startTime: string; duration: number }[];
  /** Null when the poll hides scores from this viewer. */
  tallies: BallotTallies | null;
  /** How many responses the poll has, the bar each option is measured against. */
  responseCount: number;
  /** The response an edit link names first, then newest first. */
  ownResponses: {
    id: string;
    name: string;
    votes: Record<string, BallotVote>;
  }[];
};
