import { cn } from "@rallly/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { ClockIcon } from "lucide-react";
import type * as React from "react";
import { ConnectedScoreSummary } from "@/components/poll/score-summary";
import { useOptions } from "@/components/poll-context";
import { Trans } from "@/i18n/client";

const TimeRange: React.FunctionComponent<{
  start: string;
  end: string;
  duration: string;
  className?: string;
}> = ({ start, end, duration, className }) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1.5 font-normal text-muted-foreground text-xs",
        className,
      )}
    >
      <span>{start}</span>
      <Tooltip delayDuration={0}>
        <TooltipTrigger className="flex items-center gap-x-1 opacity-50">
          <ClockIcon className="size-3" />
          {duration}
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent className="text-xs">
            {start} - {end}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </div>
  );
};

const TimelineRow = ({
  children,
  top,
  rowSpan = 0,
}: React.PropsWithChildren<{ top?: number; rowSpan?: number }>) => {
  return (
    <tr>
      {rowSpan > 0 ? (
        <th
          rowSpan={rowSpan}
          style={{ minWidth: 235, width: 235, top }}
          className={cn("sticky left-0 z-30 border-b bg-background px-4 py-2")}
        />
      ) : null}
      {children}
    </tr>
  );
};

const monthRowHeight = 48;
const dayRowHeight = 60;

const scoreRowTop = monthRowHeight + dayRowHeight;

const PollHeader = () => {
  const { options } = useOptions();

  const monthGroups: { month: string; year: string; count: number }[] = [];

  for (const option of options) {
    const last = monthGroups[monthGroups.length - 1];
    if (last?.month === option.month && last?.year === option.year) {
      last.count++;
    } else {
      monthGroups.push({ month: option.month, year: option.year, count: 1 });
    }
  }

  const dayGroups: {
    day: string;
    dow: string;
    month: string;
    year: string;
    count: number;
  }[] = [];

  for (const option of options) {
    const last = dayGroups[dayGroups.length - 1];
    if (
      last?.day === option.day &&
      last?.month === option.month &&
      last?.year === option.year
    ) {
      last.count++;
    } else {
      dayGroups.push({
        day: option.day,
        dow: option.dow,
        month: option.month,
        year: option.year,
        count: 1,
      });
    }
  }

  return (
    <>
      <TimelineRow top={0} rowSpan={3}>
        {monthGroups.map((group) => (
          <th
            key={`${group.month} ${group.year}`}
            colSpan={group.count}
            style={{ height: monthRowHeight }}
            className={cn(
              "sticky top-0 z-10 border-b border-l bg-background text-left",
            )}
          >
            <div className="sticky right-0 left-[236px] inline-flex h-5 gap-1 px-2 py-0.5 font-medium text-xs uppercase">
              <span>{group.month}</span>
              <span className="text-muted-foreground">{group.year}</span>
            </div>
          </th>
        ))}
      </TimelineRow>
      <TimelineRow top={monthRowHeight}>
        {dayGroups.map((group) => (
          <th
            key={`${group.year}-${group.month}-${group.day}`}
            colSpan={group.count}
            style={{ height: dayRowHeight, top: monthRowHeight }}
            className="border-l bg-background"
          >
            <div
              style={{ width: `calc(100% / ${group.count})` }}
              className="sticky left-[236px] z-20 mt-1 px-2 text-center"
            >
              <div className="font-normal text-muted-foreground text-xs">
                {group.dow}
              </div>
              <div className="font-medium text-sm">{group.day}</div>
            </div>
          </th>
        ))}
      </TimelineRow>
      <TimelineRow top={scoreRowTop}>
        {options.map((option) => {
          return (
            <th
              key={option.optionId}
              style={{ minWidth: 80, top: scoreRowTop }}
              className="sticky z-20 border-b border-l bg-background pb-2.5 align-top"
            >
              <div className="flex flex-col items-center gap-3">
                {option.type === "timeSlot" ? (
                  <TimeRange
                    start={option.startTime}
                    end={option.endTime}
                    duration={option.duration}
                  />
                ) : (
                  <p className="font-normal text-muted-foreground text-xs opacity-50">
                    <Trans i18nKey="allDay" defaults="All-Day" />
                  </p>
                )}
                <ConnectedScoreSummary optionId={option.optionId} />
              </div>
            </th>
          );
        })}
      </TimelineRow>
    </>
  );
};

export default PollHeader;
