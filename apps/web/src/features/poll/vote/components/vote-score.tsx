"use client";
import type { VoteType } from "@/features/poll/constants";
import { useLiveScore } from "@/features/poll/vote/components/vote-form";
import { VoteProgress } from "@/features/poll/vote/components/vote-progress";
import type { VoteResult } from "@/features/poll/vote/types";
import { Trans } from "@/i18n/client";

/** The option's "yes" capacity, as a short caption under the tally. */
function CapacityLabel({
  maxParticipants,
  yesCount,
  capacityReached,
}: {
  maxParticipants: number;
  yesCount: number | null;
  capacityReached: boolean;
}) {
  // With scores hidden the count is unknown, but the limit being met is not.
  const isFull =
    yesCount !== null ? yesCount >= maxParticipants : capacityReached;
  return (
    <span className="text-muted-foreground text-xs">
      {isFull ? (
        <Trans i18nKey="optionCapacityFull" defaults="Full" />
      ) : yesCount !== null ? (
        <Trans
          i18nKey="optionCapacityCount"
          defaults="{count} of {max} yes votes"
          values={{ count: yesCount, max: maxParticipants }}
        />
      ) : (
        <Trans
          i18nKey="optionCapacityAvailable"
          defaults="Up to {count} yes votes"
          values={{ count: maxParticipants }}
        />
      )}
    </span>
  );
}

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
  maxParticipants,
  capacityReached,
  className,
}: {
  optionId: string;
  score: VoteResult["score"];
  savedVote: VoteType | undefined;
  participantCount: number | null;
  hasSavedResponse: boolean;
  allowTentativeVotes: boolean;
  maxParticipants: number | null;
  capacityReached: boolean;
  className?: string;
}) {
  const live = useLiveScore({
    optionId,
    score,
    savedVote,
    participantCount,
    hasSavedResponse,
  });

  // Scores hidden: show the capacity caption alone, or nothing when the
  // option has no limit.
  if (!live) {
    return maxParticipants !== null ? (
      <CapacityLabel
        maxParticipants={maxParticipants}
        yesCount={null}
        capacityReached={capacityReached}
      />
    ) : null;
  }

  return (
    <div className={className}>
      <VoteProgress
        score={live.score}
        participantCount={live.participantCount}
        allowTentativeVotes={allowTentativeVotes}
      />
      {maxParticipants !== null ? (
        <CapacityLabel
          maxParticipants={maxParticipants}
          yesCount={live.score.yes}
          capacityReached={capacityReached}
        />
      ) : null}
    </div>
  );
}
