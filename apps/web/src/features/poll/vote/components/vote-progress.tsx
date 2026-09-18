"use client";
import { cn } from "@rallly/ui";
import type { VoteResult } from "@/features/poll/vote/types";
import { useTranslation } from "@/i18n/client";

/**
 * An option's tally as a share of everyone who responded: a yes segment, a
 * tentative one, and the rest left empty. The counts are also given as text
 * for screen readers, which cannot read a bar.
 */
export function VoteProgress({
  score,
  participantCount,
  allowTentativeVotes,
}: {
  score: NonNullable<VoteResult["score"]>;
  participantCount: number;
  allowTentativeVotes: boolean;
}) {
  const { t } = useTranslation();
  const total = Math.max(participantCount, score.yes + score.ifNeedBe);
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);
  // A poll that turned tentative votes off after some were cast still has
  // them, so the segment appears whenever there are any.
  const showTentative = allowTentativeVotes || score.ifNeedBe > 0;

  const label = showTentative
    ? t("optionVoteBreakdownOfTotal", {
        defaultValue:
          "{yesScore} yes, {ifNeedBeScore} if need be, of {total} responses",
        yesScore: score.yes,
        ifNeedBeScore: score.ifNeedBe,
        total: participantCount,
      })
    : t("optionVoteBreakdownYesOfTotal", {
        defaultValue: "{yesScore} yes of {total} responses",
        yesScore: score.yes,
        total: participantCount,
      });

  return (
    <span className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex h-1.5 w-16 overflow-hidden rounded-sm bg-muted"
      >
        <span
          className="h-full bg-green-500"
          style={{ width: `${pct(score.yes)}%` }}
        />
        {showTentative ? (
          <span
            className="h-full bg-amber-400"
            style={{ width: `${pct(score.ifNeedBe)}%` }}
          />
        ) : null}
      </span>
      <span
        className={cn(
          "tabular-nums",
          score.yes + score.ifNeedBe === 0 && "text-muted-foreground",
        )}
      >
        {score.yes + score.ifNeedBe}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
