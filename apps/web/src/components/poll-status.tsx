import { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";

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
            "inline-flex items-center gap-x-1.5 text-sm",
            className,
          )}
        >
          <span className="size-1.5 rounded-full bg-pink-600" />
          <Trans i18nKey="pollStatusOpen" defaults="Live" />
        </span>
      );
    case "paused":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-x-1.5 rounded-full text-sm text-gray-500",
            className,
          )}
        >
          <span className="size-1.5 rounded-full bg-gray-500" />

          <Trans i18nKey="pollStatusPaused" defaults="Paused" />
        </span>
      );
    case "finalized":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-x-1.5 rounded-full text-sm",
            className,
          )}
        >
          <span className="size-1.5 rounded-full bg-green-600" />

          <Trans i18nKey="pollStatusFinalized" defaults="Finalized" />
        </span>
      );
  }
};

export const PollStatusBadge = ({ status }: { status: PollStatus }) => {
  return <PollStatusLabel status={status} />;
};
