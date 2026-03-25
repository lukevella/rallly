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
}: React.PropsWithChildren<{ top?: number }>) => {
  return (
    <tr>
      <th
        style={{ minWidth: 235, width: 300, top }}
        className="sticky left-0 z-30 bg-background pr-4 pl-4"
      />
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

  return (
    <>
      <TimelineRow top={0}>
        {monthGroups.map((group) => (
          <th
            key={`${group.month} ${group.year}`}
            colSpan={group.count}
            style={{ height: monthRowHeight }}
            className={cn(
              "sticky top-0 z-10 border-card-border border-l bg-background",
            )}
          >
            <div className="sticky right-0 left-[235px] inline-flex h-5 gap-1 px-2 py-0.5 font-medium text-xs uppercase">
              <span>{group.month}</span>
              <span className="text-muted-foreground">{group.year}</span>
            </div>
          </th>
        ))}
      </TimelineRow>
      <TimelineRow top={monthRowHeight}>
        {options.map((option, i) => {
          const firstOfDay =
            i === 0 ||
            options[i - 1]?.day !== option.day ||
            options[i - 1]?.month !== option.month ||
            options[i - 1]?.year !== option.year;

          const lastOfDay =
            i === options.length - 1 ||
            options[i + 1]?.day !== option.day ||
            options[i + 1]?.month !== option.month ||
            options[i + 1]?.year !== option.year;
          return (
            <th
              key={option.optionId}
              style={{
                minWidth: 80,
                height: dayRowHeight,
                left: firstOfDay && !lastOfDay ? 235 : 0,
                top: monthRowHeight,
              }}
              className={cn(
                "sticky space-y-2 border-t bg-background",
                firstOfDay ? "z-20" : "z-10",
                {
                  "border-l": firstOfDay,
                },
              )}
            >
              {firstOfDay ? (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="font-normal text-muted-foreground text-xs">
                    {option.dow}
                  </div>
                  <div className="font-medium text-sm">{option.day}</div>
                </div>
              ) : null}
            </th>
          );
        })}
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
