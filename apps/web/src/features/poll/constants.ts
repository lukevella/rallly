export const MAX_POLL_OPTIONS = 100;

export const MAX_PARTICIPANTS = 1000;

// Display order of the built-in vote types.
export const VOTE_TYPES = ["yes", "ifNeedBe", "no"] as const;

export type VoteType = (typeof VOTE_TYPES)[number];

const YES_NO_VOTE_TYPES = ["yes", "no"] as const;

// The vote types a poll offers. Dropping the tentative option leaves a plain
// yes/no poll; existing "ifNeedBe" votes cast before the option was turned off
// are unaffected and still render.
export const getVoteTypes = (
  allowTentativeVotes: boolean,
): readonly VoteType[] =>
  allowTentativeVotes ? VOTE_TYPES : YES_NO_VOTE_TYPES;
