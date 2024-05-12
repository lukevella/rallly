import { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import { Badge } from "@rallly/ui/badge";
import { CalendarCheckIcon, PauseIcon, RadioIcon } from "lucide-react";

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
            "inline-flex items-center gap-x-1.5 text-sm font-medium text-gray-800",
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
            "text-muted-foreground inline-flex items-center gap-x-1.5 text-sm font-medium",
            className,
          )}
        >
          <PauseIcon className="inline-block size-4 opacity-75" />
          <Trans i18nKey="pollStatusPaused" defaults="Paused" />
        </span>
      );
    case "finalized":
      return (
        <span
          className={cn(
            "text-primary-50 inline-flex items-center gap-x-1.5 text-sm font-medium",
            className,
          )}
        >
          <CalendarCheckIcon className="inline-block size-4 opacity-75" />
          <Trans i18nKey="pollStatusFinalized" defaults="Finalized" />
        </span>
      );
  }
};

export const PollStatusBadge = ({ status }: { status: PollStatus }) => {
  return (
    <Badge
      size="lg"
      variant={
        status === "finalized"
          ? "primary"
          : status === "paused"
            ? "default"
            : "outline"
      }
    >
      <PollStatusLabel status={status} />
    </Badge>
  );
};
