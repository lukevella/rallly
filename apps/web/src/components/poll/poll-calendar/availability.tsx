"use client";

import { cn } from "@rallly/ui";
import { UsersIcon } from "lucide-react";

import { IfScoresVisible } from "@/components/visibility";
import { Trans } from "@/i18n/client";

/**
 * Maps a day/option's best-case availability onto a 0–1 heat intensity, floored
 * so any day with options stays faintly visible against empty days.
 */
export function getHeatOpacity(available: number, highScore: number) {
  if (highScore <= 0 || available <= 0) {
    return 0;
  }
  return Math.max(Math.min(available / highScore, 1), 0.2);
}

export function AvailabilityCount({
  available,
  ifNeedBe = 0,
  showIcon = true,
  className,
}: {
  available: number;
  ifNeedBe?: number;
  showIcon?: boolean;
  className?: string;
}) {
  return (
    <IfScoresVisible>
      <span
        className={cn(
          "inline-flex items-center gap-1 font-medium text-xs tabular-nums",
          className,
        )}
      >
        {showIcon ? <UsersIcon className="size-3.5 opacity-70" /> : null}
        {available}
        {ifNeedBe > 0 ? (
          <span className="inline-block size-1.5 rounded-full bg-amber-400" />
        ) : null}
      </span>
    </IfScoresVisible>
  );
}

function VoteChip({
  count,
  color,
  label,
}: {
  count: number;
  color: string;
  label: React.ReactNode;
}) {
  if (count === 0) {
    return null;
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs tabular-nums">
      <span className={cn("inline-block size-2 rounded-full", color)} />
      <span className="sr-only">{label} </span>
      {count}
    </span>
  );
}

export function VoteBreakdown({
  yes,
  ifNeedBe,
  no,
}: {
  yes: number;
  ifNeedBe: number;
  no: number;
}) {
  return (
    <IfScoresVisible>
      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <VoteChip
          count={yes}
          color="bg-emerald-500"
          label={<Trans i18nKey="yes" defaults="Yes" />}
        />
        <VoteChip
          count={ifNeedBe}
          color="bg-amber-400"
          label={<Trans i18nKey="ifNeedBe" defaults="If need be" />}
        />
        <VoteChip
          count={no}
          color="bg-gray-300 dark:bg-gray-600"
          label={<Trans i18nKey="no" defaults="No" />}
        />
      </span>
    </IfScoresVisible>
  );
}
