"use client";

import { Badge } from "@rallly/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { BirdIcon } from "lucide-react";
import type * as React from "react";
import { Trans } from "@/i18n/client";

export function EarlySupporterBadge({
  children,
}: {
  /** Tooltip content explaining what the rate means for this subscriber. */
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Badge tabIndex={0} variant="pink" className="gap-1" />}
      >
        <BirdIcon className="size-3" />
        <Trans i18nKey="earlySupporter" defaults="Early supporter" />
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">{children}</TooltipContent>
    </Tooltip>
  );
}
