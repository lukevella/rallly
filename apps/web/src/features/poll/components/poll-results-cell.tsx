"use client";

import { cn } from "@rallly/ui";
import { StarIcon } from "lucide-react";
import type { OptionState } from "@/features/poll/types";
import { Trans } from "@/i18n/client";

export function PollResultsCell({
  state,
  available,
  total,
  day,
  label,
  className,
}: {
  state: OptionState;
  available: number;
  total: number;
  day?: number;
  label?: string;
  className?: string;
}) {
  return (
    <td className={cn("p-1", className)}>
      <div
        className={cn(
          "flex h-full min-h-12 flex-col items-center justify-center gap-0.5 rounded-md text-sm tabular-nums",
          state === "normal" && "bg-muted/50 text-muted-foreground",
          state === "popular" &&
            "bg-green-500/10 text-green-700 dark:text-green-400",
          state === "best" &&
            "bg-green-500/20 font-semibold text-green-800 ring-2 ring-green-600 ring-inset dark:text-green-300",
        )}
      >
        {day !== undefined ? (
          <span aria-hidden="true" className="text-foreground text-xs">
            {day}
          </span>
        ) : null}
        <span aria-hidden="true" className="flex items-center gap-1">
          {state === "best" ? (
            <StarIcon className="size-3 fill-current" />
          ) : null}
          {available}/{total}
        </span>
        <span className="sr-only">
          {label ? (
            <>
              {label}
              {", "}
            </>
          ) : null}
          <Trans
            i18nKey="voteSummaryAvailable"
            defaults="{availableCount} of {total} available"
            values={{ availableCount: available, total }}
          />
          {state === "best" ? (
            <>
              {", "}
              <Trans i18nKey="pollResultsBest" defaults="Best" />
            </>
          ) : null}
          {state === "popular" ? (
            <>
              {", "}
              <Trans i18nKey="pollResultsPopular" defaults="Popular" />
            </>
          ) : null}
        </span>
      </div>
    </td>
  );
}
