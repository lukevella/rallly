import type { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";

import { Trans } from "@/components/trans";

import { PollStatusIcon } from "./poll-status-icon";

export const PollStatusLabel = ({
  status,
  className,
}: {
  status: PollStatus;
  className?: string;
}) => {
  switch (status) {
    case "live":
      return (
        <span
          className={cn("inline-flex items-center gap-x-2 text-sm", className)}
        >
          <PollStatusIcon status={status} />
          <Trans i18nKey="pollStatusOpen" defaults="Live" />
        </span>
      );
    case "paused":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-x-2 rounded-full text-sm",
            className,
          )}
        >
          <PollStatusIcon status={status} />
          <Trans i18nKey="pollStatusPaused" defaults="Paused" />
        </span>
      );
    case "finalized":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-x-2 rounded-full text-sm",
            className,
          )}
        >
          <PollStatusIcon status={status} />
          <Trans i18nKey="pollStatusFinalized" defaults="Finalized" />
        </span>
      );
  }
};

export const PollStatusBadge = ({ status }: { status: PollStatus }) => {
  return <PollStatusLabel status={status} />;
};
