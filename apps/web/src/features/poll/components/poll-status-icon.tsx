import type { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import {
  CircleCheckIcon,
  CircleIcon,
  CircleStopIcon,
  CircleXIcon,
} from "lucide-react";

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
      case "open":
        return <CircleIcon className="size-4 text-gray-500" />;
      case "closed":
        return <CircleStopIcon className="size-4 text-gray-500" />;
      case "scheduled":
        return <CircleCheckIcon className="size-4 text-green-500" />;
      case "canceled":
        return <CircleXIcon className="size-4 text-rose-500" />;
    }
  })();

  const label = (() => {
    switch (status) {
      case "open":
        return <Trans i18nKey="pollStatusOpen" defaults="Open" />;
      case "closed":
        return <Trans i18nKey="pollStatusClosed" defaults="Closed" />;
      case "scheduled":
        return <Trans i18nKey="pollStatusScheduled" defaults="Scheduled" />;
      case "canceled":
        return <Trans i18nKey="pollStatusCanceled" defaults="Canceled" />;
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
