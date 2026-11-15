import { NumberTicker } from "@rallly/ui/number-ticker";
import { UserRoundIcon } from "lucide-react";
import { Trans } from "@/i18n/client";

/** How many people can make an option. */
export function BallotCount({ value }: { value: number }) {
  return (
    <span
      data-testid="ballot-tally"
      className="flex items-center justify-end gap-1 text-muted-foreground text-xs tabular-nums"
    >
      <UserRoundIcon className="size-3.5" aria-hidden="true" />
      {/* Rolls to the new count as an answer changes it. Hidden whole, with the
          ticker's own reading of the number: the sentence below says it. */}
      <span aria-hidden="true">
        <NumberTicker value={value} duration={0.3} />
      </span>
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
