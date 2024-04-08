import { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import { CheckCircleIcon, PauseCircleIcon, RadioIcon } from "lucide-react";

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
          className={cn(
            "inline-flex items-center gap-x-1.5 text-sm font-medium text-pink-600",
            className,
          )}
        >
          <RadioIcon className="inline-block size-4 opacity-75" />
          <Trans i18nKey="pollStatusOpen" defaults="Live" />
        </span>
      );
    case "paused":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-x-1.5 text-sm font-medium text-gray-600",
            className,
          )}
        >
          <PauseCircleIcon className="inline-block size-4 opacity-75" />
          <Trans i18nKey="pollStatusPaused" defaults="Paused" />
        </span>
      );
    case "finalized":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-x-1.5 text-sm font-medium text-indigo-600",
            className,
          )}
        >
          <CheckCircleIcon className="inline-block size-4 opacity-75" />
          <Trans i18nKey="pollStatusFinalized" defaults="Finalized" />
        </span>
      );
  }
};

export const PollStatusBadge = ({ status }: { status: PollStatus }) => {
  return (
    <PollStatusLabel
      className={cn(
        "h-6 whitespace-nowrap rounded-md p-1.5 text-xs font-medium",
        {
          "border-pink-200 bg-pink-50 text-pink-600": status === "live",
          "border-gray-200 bg-gray-100 text-gray-500": status === "paused",
          "border-indigo-200 bg-indigo-50 text-indigo-600":
            status === "finalized",
        },
      )}
      status={status}
    />
  );
};
