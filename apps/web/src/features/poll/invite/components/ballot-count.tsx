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
      <span aria-hidden="true">{value}</span>
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
