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
      className={cn("rounded-full py-1.5 pr-3 ring-1 pl-2 text-xs", {
        "bg-blue-600 text-blue-50 ring-blue-700": status === "live",
        "bg-gray-100 text-gray-500 ring-gray-200": status === "paused",
        "bg-green-600 text-green-50 ring-green-700": status === "finalized",
      })}
      status={status}
    />
  );
};
