"use client";
import { cn } from "@rallly/ui";
import { Alert, AlertDescription } from "@rallly/ui/alert";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import VoteIcon from "@/features/poll/components/vote-icon";
import type { VoteType } from "@/features/poll/constants";
import { Trans } from "@/i18n/client";

/**
 * Stands in for the vote control on an option that is over. The vote stays
 * visible but cannot change; the server refuses a change
 * too. No vote reads as "no", which is what the form submits for it.
 */
export function PastOptionVote({
  type,
  className,
}: {
  type?: VoteType;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={0}
        className={cn("flex items-center justify-center opacity-50", className)}
      >
        <VoteIcon type={type ?? "no"} />
      </TooltipTrigger>
      <TooltipContent className="text-xs">
        <Trans i18nKey="pastOptionVoteTooltip" defaults="This option is over" />
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Says why the poll takes no new response once every option is over: the
 * add-response buttons are gone, and the page should not look broken.
 */
export function AllOptionsPastNotice() {
  return (
    <Alert>
      <AlertDescription>
        <Trans
          i18nKey="allOptionsPastNotice"
          defaults="All the options are over: no more responses are accepted."
        />
      </AlertDescription>
    </Alert>
  );
}
