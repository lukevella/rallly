"use client";

import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import dayjs from "dayjs";
import { ClockIcon } from "lucide-react";
import * as React from "react";

import { Trans } from "@/components/trans";
import { useTimezone } from "@/lib/timezone/client/context";
import {
  calculateDeadlineStatus,
  formatDeadlineForDisplay,
  type DeadlineStatus,
} from "@/utils/deadline-utils";

import { DeadlineCountdown } from "./poll/deadline-countdown";

interface DeadlineDisplayProps {
  deadline: Date | null;
  pollTimeZone: string | null;
  className?: string;
}

const getStatusStyles = (status: DeadlineStatus | null) => {
  switch (status) {
    case "passed":
      return "text-muted-foreground";
    case "urgent":
      return "text-red-600 dark:text-red-400";
    case "warning":
      return "text-amber-600 dark:text-amber-400";
    case "upcoming":
    default:
      return "text-gray-700 dark:text-gray-300";
  }
};

export const DeadlineDisplay: React.FunctionComponent<DeadlineDisplayProps> = ({
  deadline,
  pollTimeZone,
  className,
}) => {
  const { timezone } = useTimezone();
  const displayTimeZone = pollTimeZone || timezone;

  const status = React.useMemo(
    () => calculateDeadlineStatus(deadline),
    [deadline],
  );

  const formattedDeadline = React.useMemo(
    () => formatDeadlineForDisplay(deadline, displayTimeZone),
    [deadline, displayTimeZone],
  );

  if (!deadline || !formattedDeadline) {
    return null;
  }

  const statusStyles = getStatusStyles(status);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-white p-3 dark:bg-gray-800",
        status === "passed" && "border-gray-200 dark:border-gray-700",
        status === "warning" &&
          "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950",
        status === "urgent" &&
          "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950",
        status === "upcoming" &&
          "border-gray-200 dark:border-gray-700",
        className,
      )}
    >
      <Icon>
        <ClockIcon className={cn(statusStyles)} />
      </Icon>
      <div className="flex-1">
        <div className="text-muted-foreground text-sm">
          <Trans i18nKey="deadlineLabel" defaults="Deadline" />
        </div>
        <div className={cn("font-medium text-sm", statusStyles)}>
          {formattedDeadline}
        </div>
        {status !== "passed" && (
          <div className={cn("mt-1 text-xs", statusStyles)}>
            <DeadlineCountdown deadline={deadline} />
          </div>
        )}
        {status === "passed" && (
          <div className="mt-1 text-xs text-muted-foreground">
            <Trans i18nKey="deadlinePassed" defaults="Deadline passed" />
          </div>
        )}
      </div>
    </div>
  );
};

