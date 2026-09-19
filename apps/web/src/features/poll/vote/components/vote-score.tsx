"use client";
import type { VoteType } from "@/features/poll/constants";
import { useLiveScore } from "@/features/poll/vote/components/vote-form";
import { VoteProgress } from "@/features/poll/vote/components/vote-progress";
import type { VoteResult } from "@/features/poll/vote/types";

/**
 * An option's tally, following the viewer's pending vote so the bar moves
 * as they vote. Shared by every view so they agree on the arithmetic.
 */
export function VoteScore({
  optionId,
  score,
  savedVote,
  participantCount,
  hasSavedResponse,
  allowTentativeVotes,
  className,
}: {
  optionId: string;
  score: VoteResult["score"];
  savedVote: VoteType | undefined;
  participantCount: number | null;
  hasSavedResponse: boolean;
  allowTentativeVotes: boolean;
  className?: string;
}) {
  const live = useLiveScore({
    optionId,
    score,
    savedVote,
    participantCount,
    hasSavedResponse,
  });

  if (!live) {
    return null;
  }

  return (
    <VoteProgress
      score={live.score}
      participantCount={live.participantCount}
      allowTentativeVotes={allowTentativeVotes}
      className={className}
    />
  );
}
