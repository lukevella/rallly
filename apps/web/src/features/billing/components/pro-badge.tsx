"use client";

import { cn } from "@rallly/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { LockIcon } from "lucide-react";

import { Trans } from "@/i18n/client";

/** Marks a feature the space unlocks by upgrading to Pro. */
export const ProBadge = ({ className }: { className?: string }) => {
  const label = (
    <Trans i18nKey="proBadgeUnlock" defaults="Unlock with Rallly Pro" />
  );
  return (
    <Tooltip>
      <TooltipTrigger
        render={<span />}
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary",
          className,
        )}
      >
        <LockIcon aria-hidden="true" className="size-3 text-current" />
        <span className="sr-only">{label}</span>
      </TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  );
};
