import type { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { CircleCheckIcon, CirclePauseIcon, CirclePlayIcon } from "lucide-react";

import { Trans } from "@/components/trans";

interface PollStatusIconProps {
  status: PollStatus;
  className?: string;
  showTooltip?: boolean;
}

export function PollStatusIcon({
  status,
  className,
  showTooltip = true,
}: PollStatusIconProps) {
  const icon = (() => {
    switch (status) {
      case "live":
        return <CirclePlayIcon className="size-4 text-amber-500" />;
      case "paused":
        return <CirclePauseIcon className="size-4 text-gray-400" />;
      case "finalized":
        return <CircleCheckIcon className="size-4 text-green-500" />;
    }
  })();

  const label = (() => {
    switch (status) {
      case "live":
        return <Trans i18nKey="pollStatusOpen" defaults="Live" />;
      case "paused":
        return <Trans i18nKey="pollStatusPaused" defaults="Paused" />;
      case "finalized":
        return <Trans i18nKey="pollStatusFinalized" defaults="Finalized" />;
    }
  })();

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn("inline-flex", className)}>{icon}</span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <span className={cn("inline-flex", className)}>{icon}</span>;
}
