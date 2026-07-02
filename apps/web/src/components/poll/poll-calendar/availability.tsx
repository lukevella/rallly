"use client";

import { cn } from "@rallly/ui";
import { UsersIcon } from "lucide-react";

import { IfScoresVisible } from "@/components/visibility";

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
