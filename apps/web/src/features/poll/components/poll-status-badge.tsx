import { cn } from "@rallly/ui";
import {
  CircleCheckIcon,
  CircleIcon,
  CircleStopIcon,
  CircleXIcon,
} from "lucide-react";
import type * as React from "react";

import type { PollStatus } from "@/features/poll/schema";
import { Trans } from "@/i18n/client";

// Each status has its own shape so the badge never relies on colour alone,
// which matters below sm where the label is visually hidden.
function PollStatusShape({ status }: { status: PollStatus }) {
  switch (status) {
    case "open":
      return <CircleIcon aria-hidden className="size-3.5 text-blue-500" />;
    case "closed":
      return (
        <CircleStopIcon
          aria-hidden
          className="size-3.5 text-gray-400 dark:text-gray-500"
        />
      );
    case "scheduled":
      return (
        <CircleCheckIcon aria-hidden className="size-3.5 text-green-500" />
      );
    case "canceled":
      return <CircleXIcon aria-hidden className="size-3.5 text-rose-500" />;
  }
}

function PollStatusLabel({ status }: { status: PollStatus }) {
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
}

export function PollStatusBadge({
  status,
  className,
  children,
}: {
  status: PollStatus;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full text-muted-foreground text-xs sm:border sm:px-2",
        className,
      )}
    >
      <PollStatusShape status={status} />
      <span className="sr-only sm:not-sr-only">
        {children ?? <PollStatusLabel status={status} />}
      </span>
    </span>
  );
}
