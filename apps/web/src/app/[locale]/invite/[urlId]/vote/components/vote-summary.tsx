"use client";

import VoteIcon from "@/features/poll/components/vote-icon";
import type { BallotVote } from "@/features/poll/invite/types";
import { Trans } from "@/i18n/client";

export function VoteSummary({ votes }: { votes: BallotVote[] }) {
  const availableCount = votes.filter((vote) => vote === "yes").length;
  const ifNeedBeCount = votes.filter((vote) => vote === "ifNeedBe").length;

  return (
    <div className="flex min-h-9 w-full flex-col justify-center gap-1.5 rounded-xl border border-input bg-background/80 px-2.5 py-1.25 dark:bg-foreground/5">
      {availableCount > 0 ? (
        <span className="flex items-center gap-2">
          <VoteIcon round type="yes" className="size-4" />
          <Trans
            i18nKey="voteSummaryAvailable"
            defaults="{availableCount} of {total} available"
            values={{ availableCount, total: votes.length }}
          />
        </span>
      ) : ifNeedBeCount === 0 ? (
        <span className="flex items-center gap-2">
          <VoteIcon round type="no" className="size-4" />
          <Trans
            i18nKey="voteSummaryNotAvailable"
            defaults="You're not available"
          />
        </span>
      ) : null}
      {ifNeedBeCount > 0 ? (
        <span className="flex items-center gap-2">
          <VoteIcon round type="ifNeedBe" className="size-4" />
          <Trans
            i18nKey="voteSummaryIfNeedBe"
            defaults="{count} if need be"
            values={{ count: ifNeedBeCount }}
          />
        </span>
      ) : null}
    </div>
  );
}
