"use client";

import dayjs from "dayjs";

import { Trans } from "@/components/trans";
import { DateDisplay, DateTimeDisplay } from "@/features/timezone";

interface ScheduledEventDisplayProps {
  event?: {
    start: Date;
    duration: number;
  };
  dateOptions?: {
    first?: Date;
    last?: Date;
    count: number;
  };
}

export const ScheduledEventDisplay = ({
  event,
  dateOptions,
}: ScheduledEventDisplayProps) => {
  if (event) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          {event.duration > 0 ? (
            <DateTimeDisplay date={dayjs(event.start)} />
          ) : (
            <DateDisplay date={dayjs(event.start)} />
          )}
        </span>
      </div>
    );
  }

  if (!dateOptions?.first || !dateOptions?.last || dateOptions.count === 0) {
    return (
      <span className="text-muted-foreground">
        <Trans i18nKey="noDates" defaults="No dates" />
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        <Trans
          i18nKey="optionCount"
          defaults="{count, plural, one {# option} other {# options}}"
          values={{ count: dateOptions.count }}
        />
      </span>
    </div>
  );
};
