import { cn } from "@rallly/ui";
import type * as React from "react";

/** The size of a button in the bar: the height of a ballot row, with its corners. */
export const ballotBarButtonClassName = "h-12 rounded-xl";

/** A shortcut toggle for the options: dashed until it is on. */
export const ballotToggleClassName =
  "border border-gray-400 border-dashed text-muted-foreground hover:text-foreground aria-pressed:border-solid aria-pressed:bg-gray-200 aria-pressed:text-foreground aria-pressed:hover:bg-gray-200 dark:border-gray-500 dark:aria-pressed:bg-white/15 dark:aria-pressed:hover:bg-white/15";

/**
 * Floats the ballot's actions over the options, at the end of the bottom bar.
 * As a bar they fill the width instead and match the rows they sit under.
 */
export function BallotPill({
  children,
  bar = false,
}: {
  children: React.ReactNode;
  bar?: boolean;
}) {
  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center",
        bar
          ? "w-full gap-2"
          : "ml-auto gap-1 rounded-full bg-gray-100/80 p-1 shadow-xs backdrop-blur-lg dark:bg-gray-800/80",
      )}
    >
      {children}
    </div>
  );
}
