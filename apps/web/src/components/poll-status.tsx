import type { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import { CircleCheckIcon, CircleIcon, CirclePauseIcon } from "lucide-react";

import { Trans } from "@/components/trans";

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
          <CircleIcon className="size-4 rounded-full text-pink-600" />
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
          <CirclePauseIcon className="size-4 rounded-full text-gray-600" />

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
          <CircleCheckIcon className="size-4 rounded-full text-green-600" />

          <Trans i18nKey="pollStatusFinalized" defaults="Finalized" />
        </span>
      );
  }
};

export const PollStatusBadge = ({ status }: { status: PollStatus }) => {
  return <PollStatusLabel status={status} />;
};
