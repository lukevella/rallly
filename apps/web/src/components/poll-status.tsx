import { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";

import { Trans } from "@/components/trans";

const LabelWithIcon = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {children}
    </span>
  );
};

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
        <LabelWithIcon className={className}>
          <span className="inline-block size-2 rounded-full bg-amber-500" />
          <Trans i18nKey="pollStatusGatheringAvailability" defaults="Pending" />
        </LabelWithIcon>
      );
    case "paused":
      return (
        <LabelWithIcon className={className}>
          <span className="inline-block size-2 rounded-full bg-gray-400" />
          <Trans i18nKey="pollStatusPausedClosed" defaults="Closed" />
        </LabelWithIcon>
      );
    case "finalized":
      return (
        <LabelWithIcon className={className}>
          <span className="inline-block size-2 rounded-full bg-green-500" />
          <Trans i18nKey="pollStatusSchedulde" defaults="Scheduled" />
        </LabelWithIcon>
      );
  }
};

export const PollStatusBadge = ({ status }: { status: PollStatus }) => {
  return (
    <PollStatusLabel
      className={cn("whitespace-nowrap text-xs font-medium", {
        "text-amber-600": status === "live",
        "text-gray-500": status === "paused",
        "text-green-600": status === "finalized",
      })}
      status={status}
    />
  );
};
