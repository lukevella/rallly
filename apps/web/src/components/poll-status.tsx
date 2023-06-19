import { CheckCircleIcon, PauseCircleIcon, RadioIcon } from "@rallly/icons";
import { cn } from "@rallly/ui";

import { Trans } from "@/components/trans";
import { IconComponent } from "@/types";

export type PollState = "live" | "paused" | "closed";

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
      <span>{children}</span>
    </span>
  );
};

export const PollStatus = ({
  status,
  className,
}: {
  status: PollState;
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
    case "closed":
      return (
        <LabelWithIcon icon={CheckCircleIcon} className={className}>
          <Trans i18nKey="pollStatusClosed" defaults="Finalized" />
        </LabelWithIcon>
      );
  }
};

export const PollStatusBadge = ({ status }: { status: PollState }) => {
  return (
    <PollStatus
      className={cn("rounded-full border py-0.5 pl-1.5 pr-3 text-sm", {
        "border-blue-500 text-blue-500": status === "live",
        "border-gray-500 text-gray-500": status === "paused",
        "border-green-500 text-green-500": status === "closed",
      })}
      status={status}
    />
  );
};
