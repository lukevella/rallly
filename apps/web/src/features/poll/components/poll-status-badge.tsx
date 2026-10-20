import { cn } from "@rallly/ui";
import type * as React from "react";

import type { PollStatus } from "@/features/poll/schema";
import { Trans } from "@/i18n/client";

const dotClassName: Record<PollStatus, string> = {
  open: "bg-blue-500",
  closed: "bg-gray-400 dark:bg-gray-500",
  scheduled: "bg-green-500",
  canceled: "bg-rose-500",
};

export function PollStatusDot({ status }: { status: PollStatus }) {
  return (
    <span
      aria-hidden
      className={cn("size-2 shrink-0 rounded-full", dotClassName[status])}
    />
  );
}

export function PollStatusLabel({ status }: { status: PollStatus }) {
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
      <PollStatusDot status={status} />
      <span className="sr-only sm:not-sr-only">
        {children ?? <PollStatusLabel status={status} />}
      </span>
    </span>
  );
}
