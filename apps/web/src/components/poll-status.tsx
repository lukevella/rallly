import { PollStatus } from "@rallly/database";
import { cn } from "@rallly/ui";
import { CheckCircleIcon, PauseCircleIcon, RadioIcon } from "lucide-react";

import { Trans } from "@/components/trans";
import { IconComponent } from "@/types";

const LabelWithIcon = ({
  icon: Icon,
  children,
  className,
}: {
  icon: IconComponent;
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Icon className="h-4 w-4" />
      <span className="font-medium">{children}</span>
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
        <LabelWithIcon icon={RadioIcon} className={className}>
          <Trans i18nKey="pollStatusOpen" defaults="Live" />
        </LabelWithIcon>
      );
    case "paused":
      return (
        <LabelWithIcon icon={PauseCircleIcon} className={className}>
          <Trans i18nKey="pollStatusPaused" defaults="Paused" />
        </LabelWithIcon>
      );
    case "finalized":
      return (
        <LabelWithIcon icon={CheckCircleIcon} className={className}>
          <Trans i18nKey="pollStatusClosed" defaults="Finalized" />
        </LabelWithIcon>
      );
  }
};

export const PollStatusBadge = ({ status }: { status: PollStatus }) => {
  return (
    <PollStatusLabel
      className={cn("rounded-full border py-1.5 pr-3 pl-2 text-xs", {
        "bg-primary-50 border-primary-100 text-primary-500": status === "live",
        "bg-gray-200 border-gray-200 text-gray-500": status === "paused",
        "bg-green-50 text-green-500 border-green-100": status === "finalized",
      })}
      status={status}
    />
  );
};
