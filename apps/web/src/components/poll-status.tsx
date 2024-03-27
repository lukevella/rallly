import { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import {
  CalendarCheckIcon,
  CalendarSearchIcon,
  CalendarXIcon,
  CheckIcon,
  RefreshCw,
  XIcon,
} from "lucide-react";

import { Trans } from "@/components/trans";

const LabelWithIcon = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
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
          <RefreshCw className="size-4 opacity-75" />
          <Trans i18nKey="pollStatusInProgress" defaults="In Progress" />
        </LabelWithIcon>
      );
    case "paused":
      return (
        <LabelWithIcon className={className}>
          <XIcon className="size-4 opacity-75" />
          <Trans i18nKey="pollStatusPausedClosed" defaults="Closed" />
        </LabelWithIcon>
      );
    case "finalized":
      return (
        <LabelWithIcon className={className}>
          <CheckIcon className="size-4 opacity-75" />
          <Trans i18nKey="pollStatusClosed" defaults="Finalized" />
        </LabelWithIcon>
      );
  }
};

export const PollStatusBadge = ({ status }: { status: PollStatus }) => {
  return (
    <PollStatusLabel
      className={cn(
        "whitespace-nowrap rounded-md border px-1.5 py-1 text-xs font-medium",
        {
          "border-pink-100 bg-pink-50 text-pink-500": status === "live",
          "border-green-100 bg-green-50 text-green-600 ":
            status === "finalized",
          "bg-gray-200 text-gray-600 ": status === "paused",
        },
      )}
      status={status}
    />
  );
};
