"use client";

import { Trans } from "@/i18n/client";
import { useDateTime, useDateTimeConfig } from "@/lib/datetime/client";
import { formatDateParts } from "@/lib/datetime/format";

type Option = { startTime: Date; duration: number };

// All day dates and floating times are stored as UTC wall time.
export function optionZone(option: Option, floating: boolean) {
  return option.duration === 0 || floating ? { timeZone: "UTC" } : {};
}

/** A small calendar page: the weekday over the day of the month. */
function DateTile({ option, floating }: { option: Option; floating: boolean }) {
  const { locale, timeZone } = useDateTimeConfig();
  const { weekday, day } = formatDateParts(option.startTime, {
    locale,
    timeZone: optionZone(option, floating).timeZone ?? timeZone ?? "UTC",
  });
  return (
    <div
      aria-hidden="true"
      className="flex size-12 shrink-0 flex-col overflow-hidden rounded-lg border border-card-border bg-card text-center"
    >
      <div className="border-card-border border-b text-[11px] text-muted-foreground uppercase leading-4">
        {weekday}
      </div>
      <div className="flex grow items-center justify-center font-medium text-lg tabular-nums leading-none">
        {day}
      </div>
    </div>
  );
}

/**
 * The option's date beside a calendar tile, with its time range or All day
 * under it. Shared by the vote breakdown and the finalize dialog.
 */
export function OptionDateHeader({
  option,
  floating,
}: {
  option: Option;
  floating: boolean;
}) {
  const { formatDateTime } = useDateTime();
  const zone = optionZone(option, floating);
  return (
    <div className="flex items-center gap-4">
      <DateTile option={option} floating={floating} />
      <div className="min-w-0">
        <p className="font-medium text-base">
          {formatDateTime(option.startTime, "weekdayMonthDay", zone)}
        </p>
        {option.duration > 0 ? (
          <p className="text-muted-foreground tabular-nums">
            {formatDateTime(option.startTime, "time", zone)}
            {" – "}
            {formatDateTime(
              new Date(option.startTime.getTime() + option.duration * 60_000),
              "time",
              zone,
            )}
          </p>
        ) : (
          <p className="text-muted-foreground">
            <Trans i18nKey="allDay" defaults="All day" />
          </p>
        )}
      </div>
    </div>
  );
}
