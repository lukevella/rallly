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
  className,
}: {
  score: NonNullable<VoteResult["score"]>;
  participantCount: number;
  allowTentativeVotes: boolean;
  /** Sizes the track; a calendar cell gives it the full cell width. */
  className?: string;
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

  const yesPct = pct(score.yes);
  const tentativePct = pct(score.ifNeedBe);

  return (
    <span className="flex items-center">
      <span
        aria-hidden="true"
        // The track needs to read as an empty share, so it sits a step away
        // from the surface in both themes rather than using one muted token.
        className={cn(
          "relative block h-1.5 w-16 overflow-hidden rounded-sm bg-gray-200 dark:bg-gray-700",
          className,
        )}
      >
        {/* Each segment fills the track and is scaled down to its share, so
            the size change is a transform rather than a width: width would
            lay out and paint every frame, and two flex siblings animating
            their widths would fight over the leftover space.
            motion-reduce keeps the colour and drops the travel. */}
        <span
          className="absolute inset-0 origin-left bg-green-500 transition-transform duration-200 ease-out-ui motion-reduce:transition-none"
          style={{ transform: `scaleX(${yesPct / 100})` }}
        />
        {showTentative ? (
          <span
            className="absolute inset-0 origin-left bg-amber-400 transition-transform duration-200 ease-out-ui motion-reduce:transition-none"
            style={{
              // Sits after the yes segment, then takes its own share.
              transform: `translateX(${yesPct}%) scaleX(${tentativePct / 100})`,
            }}
          />
        ) : null}
      </span>
      {/* The bar carries no number, so the counts are the only thing a
          screen reader gets. */}
      <span className="sr-only">{label}</span>
    </span>
  );
}
