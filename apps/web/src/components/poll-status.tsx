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
    <span className={cn("inline-flex items-center gap-2.5", className)}>
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
          <span className="inline-block size-2 rounded-full bg-amber-400" />
          <Trans i18nKey="pollStatusInProgress" defaults="In Progress" />
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
          <span className="inline-block size-2 rounded-full bg-green-400" />
          <Trans i18nKey="pollStatusClosed" defaults="Finalized" />
        </LabelWithIcon>
      );
  }
};

export const PollStatusBadge = ({ status }: { status: PollStatus }) => {
  return (
    <PollStatusLabel
      className={cn("whitespace-nowrap rounded-md px-2.5 text-xs font-medium")}
      status={status}
    />
  );
};
