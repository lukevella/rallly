"use client";

import { cn } from "@rallly/ui";
import { Button } from "@rallly/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import { HistoryIcon } from "lucide-react";
import { Trans } from "@/i18n/client";
import type { PastOptions } from "../client";
import { ballotToggleClassName } from "./ballot-pill";

/** Past times stay out of the way unless asked for. Icon only below sm. */
export function PastTimesToggle({
  past,
  labelled = false,
  className,
}: {
  past: PastOptions;
  /** A toggle with its label on every screen, beside the ballot's shortcuts. */
  labelled?: boolean;
  /** Added to the labelled toggle. */
  className?: string;
}) {
  if (labelled) {
    return (
      <Button
        variant="ghost"
        aria-pressed={past.show}
        className={cn(ballotToggleClassName, className)}
        onClick={past.toggle}
      >
        <Trans
          i18nKey="pastTimesToggleShow"
          defaults="{count, plural, one {Show # past time} other {Show # past times}}"
          values={{ count: past.ids.size }}
        />
      </Button>
    );
  }

  const label = past.show ? (
    <Trans i18nKey="ballotHidePast" defaults="Hide past times" />
  ) : (
    <Trans
      i18nKey="pastTimesToggleShow"
      defaults="{count, plural, one {Show # past time} other {Show # past times}}"
      values={{ count: past.ids.size }}
    />
  );

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="sm"
            variant="ghost"
            className="max-sm:size-7 max-sm:px-0"
            onClick={past.toggle}
          />
        }
      >
        <HistoryIcon />
        <span className="max-sm:sr-only">{label}</span>
      </TooltipTrigger>
      {/* From sm the label is on the button. */}
      <TooltipContent className="sm:hidden">{label}</TooltipContent>
    </Tooltip>
  );
}
