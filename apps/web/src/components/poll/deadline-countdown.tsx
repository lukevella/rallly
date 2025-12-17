"use client";

import dayjs from "dayjs";
import * as React from "react";

import { Trans } from "@/components/trans";
import { getHoursRemaining } from "@/utils/deadline-utils";

interface DeadlineCountdownProps {
  deadline: Date | null;
}

/**
 * Format hours remaining into a human-readable string
 */
function formatTimeRemaining(hours: number): string {
  const days = Math.floor(hours / 24);
  const remainingHours = Math.floor(hours % 24);
  const minutes = Math.floor((hours % 1) * 60);

  const parts: string[] = [];

  if (days > 0) {
    parts.push(
      days === 1
        ? "1 day"
        : `${days} days`,
    );
  }

  if (remainingHours > 0) {
    parts.push(
      remainingHours === 1
        ? "1 hour"
        : `${remainingHours} hours`,
    );
  }

  if (days === 0 && remainingHours < 6 && minutes > 0) {
    parts.push(
      minutes === 1
        ? "1 minute"
        : `${minutes} minutes`,
    );
  }

  if (parts.length === 0) {
    return "less than a minute";
  }

  return parts.join(", ");
}

export const DeadlineCountdown: React.FunctionComponent<
  DeadlineCountdownProps
> = ({ deadline }) => {
  const [hoursRemaining, setHoursRemaining] = React.useState<number | null>(
    null,
  );

  React.useEffect(() => {
    if (!deadline) {
      setHoursRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const hours = getHoursRemaining(deadline);
      setHoursRemaining(hours);
    };

    updateCountdown();

    const interval = setInterval(updateCountdown, 60000);

    return () => {
      clearInterval(interval);
    };
  }, [deadline]);

  if (!deadline || hoursRemaining === null) {
    return null;
  }

  if (hoursRemaining <= 0) {
    return (
      <Trans
        i18nKey="deadlinePassed"
        defaults="Deadline passed"
      />
    );
  }

  return (
    <Trans
      i18nKey="deadlineRemaining"
      values={{ time: formatTimeRemaining(hoursRemaining) }}
      defaults="{time} remaining"
    />
  );
};

