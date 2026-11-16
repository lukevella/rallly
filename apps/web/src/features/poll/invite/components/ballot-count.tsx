"use client";

import { cn } from "@rallly/ui";
import { NumberTicker } from "@rallly/ui/number-ticker";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import { UserRoundIcon } from "lucide-react";
import { Trans } from "@/i18n/client";

/**
 * How many people can make an option. With `breakdown` it is a button that
 * opens who answered what in a popover.
 */
export function BallotCount({
  value,
  breakdown,
}: {
  value: number;
  breakdown?: React.ReactNode;
}) {
  const content = (
    <>
      <UserRoundIcon className="size-3.5" aria-hidden="true" />
      {/* Rolls to the new count as an answer changes it. Hidden whole, with the
          ticker's own reading of the number: the sentence below says it. */}
      <span aria-hidden="true">
        <NumberTicker value={value} duration={0.3} />
      </span>
    </>
  );
  const className =
    "flex items-center justify-end gap-1 text-muted-foreground text-xs tabular-nums";

  if (breakdown) {
    return (
      <Popover>
        <PopoverTrigger
          data-testid="ballot-tally"
          render={<button type="button" />}
          className={cn(
            className,
            // Inset by the same 3px from the row's top, bottom and right edges, with
            // the radius that keeps it concentric with the row's corners.
            "relative z-10 -my-1.5 -mr-2.75 h-10.5 cursor-pointer rounded-lg border border-input bg-background/80 px-2.5 shadow-xs hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring data-popup-open:bg-accent lg:[@media(pointer:fine)]:h-8",
          )}
        >
          {content}
          <span className="sr-only">
            <Trans
              i18nKey="ballotShowBreakdown"
              defaults="{count} available, show who answered"
              values={{ count: value }}
            />
          </span>
        </PopoverTrigger>
        {/* React events cross the portal: keep clicks in here from reaching the
            row, which would change the vote. */}
        <PopoverContent
          align="end"
          className="w-72 gap-0 p-0"
          onClick={(event) => event.stopPropagation()}
        >
          {breakdown}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <span data-testid="ballot-tally" className={className}>
      {content}
      <span className="sr-only">
        <Trans
          i18nKey="ballotAvailableCount"
          defaults="{count} available"
          values={{ count: value }}
        />
      </span>
    </span>
  );
}
