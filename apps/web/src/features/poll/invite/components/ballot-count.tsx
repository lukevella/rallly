"use client";

import { cn } from "@rallly/ui";
import { Popover, PopoverContent, PopoverTrigger } from "@rallly/ui/popover";
import { UserRoundIcon } from "lucide-react";
import { Trans } from "@/i18n/client";

const digits = Array.from({ length: 10 }, (_, digit) => digit);

/**
 * The count as columns of digits that roll to a new value. A CSS transition
 * rather than the animated ticker: there is one on every row, so it holds no
 * layers and runs no script while it rests.
 */
function RollingCount({ value }: { value: number }) {
  // Keyed by place value, so the ones keep rolling when the count gains a digit.
  const chars = String(value).split("");
  const places = chars.map((char, index) => ({
    digit: Number(char),
    place: chars.length - 1 - index,
  }));
  return (
    <span aria-hidden="true" className="inline tabular-nums">
      {places.map(({ digit: shown, place }) => (
        <span
          key={place}
          className="relative inline-block h-[1em] w-[1ch] overflow-hidden align-[-0.125em]"
        >
          <span
            className="absolute inset-x-0 top-0 flex flex-col items-center transition-transform duration-300 ease-out-ui motion-reduce:transition-none"
            style={{ transform: `translateY(-${shown}em)` }}
          >
            {digits.map((digit) => (
              <span
                key={digit}
                className="block h-[1em] text-center leading-[1em]"
              >
                {digit}
              </span>
            ))}
          </span>
        </span>
      ))}
    </span>
  );
}

/**
 * How many people can make an option. With `breakdown` it is a button that
 * opens who answered what in a popover.
 */
export function BallotCount({
  value,
  breakdown,
  onBreakdownOpen,
}: {
  value: number;
  breakdown?: React.ReactNode;
  onBreakdownOpen?: () => void;
}) {
  const content = (
    <>
      <UserRoundIcon className="size-3.5" aria-hidden="true" />
      {/* Rolls to the new count as an answer changes it. Hidden whole, with the
          ticker's own reading of the number: the sentence below says it. */}
      <RollingCount value={value} />
    </>
  );
  const className =
    "flex items-center justify-end gap-1 text-muted-foreground text-xs tabular-nums";

  if (breakdown) {
    return (
      <Popover
        onOpenChange={(open) => {
          if (open) onBreakdownOpen?.();
        }}
      >
        <PopoverTrigger
          data-testid="ballot-tally"
          render={<button type="button" />}
          className={cn(
            className,
            // Inset by the same 3px from the row's top, bottom and right edges, with
            // the radius that keeps it concentric with the row's corners.
            "relative z-10 -my-1.5 -mr-2.75 h-10.5 cursor-pointer rounded-lg border border-foreground/10 bg-background/50 px-2.5 shadow-xs backdrop-blur-sm hover:bg-background/70 focus-visible:outline-2 focus-visible:outline-ring data-popup-open:bg-background/70 lg:[@media(pointer:fine)]:h-8",
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
