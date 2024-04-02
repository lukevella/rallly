import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@rallly/ui/tooltip";
import { ClockIcon } from "lucide-react";
import * as React from "react";

import { ConnectedScoreSummary } from "@/components/poll/score-summary";
import { useOptions } from "@/components/poll-context";

const TimeRange: React.FunctionComponent<{
  start: string;
  end: string;
  duration: string;
  className?: string;
}> = ({ start, end, duration, className }) => {
  return (
    <div className={cn("text-muted-foreground text-xs font-normal", className)}>
      <Tooltip>
        <TooltipTrigger>{start}</TooltipTrigger>
        <TooltipPortal>
          <TooltipContent className="flex gap-x-2.5 text-xs">
            <span className="text-muted-foreground flex items-center gap-x-1">
              <Icon>
                <ClockIcon />
              </Icon>
              {duration}
            </span>
            <span>
              {start} - {end}
            </span>
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
        style={{ minWidth: 240, top }}
        className="sticky left-0  z-30 bg-white pl-4 pr-4"
      ></th>
      {children}
      <th className="-ml-4 w-full min-w-4 border-l bg-gray-100" />
    </tr>
  );
};

const monthRowHeight = 48;
const dayRowHeight = 64;

const scoreRowTop = monthRowHeight + dayRowHeight;

const PollHeader: React.FunctionComponent = () => {
  const { options } = useOptions();
  return (
    <>
      <TimelineRow top={0}>
        {options.map((option, i) => {
          const firstOfMonth =
            i === 0 || options[i - 1]?.month !== option.month;

          return (
            <th
              key={option.optionId}
              style={{ height: monthRowHeight }}
              className={cn(
                "sticky top-0 space-y-3 border-b bg-gray-50",
                firstOfMonth ? "left-[240px] z-20 border-l" : "z-10",
              )}
            >
              <div className="flex">
                <div
                  className={cn(
                    "inline-flex h-5 gap-1 px-2 py-0.5 text-xs font-medium uppercase",
                    firstOfMonth ? "opacity-100" : "opacity-0",
                  )}
                >
                  <span>{option.month}</span>
                  <span className="text-muted-foreground">{option.year}</span>
                </div>
              </div>
            </th>
          );
        })}
      </TimelineRow>
      <TimelineRow top={monthRowHeight}>
        {options.map((option, i) => {
          const firstOfDay =
            i === 0 ||
            options[i - 1]?.day !== option.day ||
            options[i - 1]?.month !== option.month;
          return (
            <th
              key={option.optionId}
              style={{
                minWidth: 80,
                width: 80,
                height: dayRowHeight,
                left: firstOfDay ? 240 : 0,
                top: monthRowHeight,
              }}
              className={cn(
                "sticky space-y-2 bg-gray-50",
                firstOfDay ? "z-20 border-l" : "z-10",
              )}
            >
              {firstOfDay ? (
                <div className="flex flex-col justify-center gap-1 font-semibold">
                  <div className="text-muted-foreground text-xs font-medium uppercase">
                    {option.dow}
                  </div>
                  <div className="text-sm">{option.day}</div>
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
              style={{ minWidth: 80, maxWidth: 90, top: scoreRowTop }}
              className="sticky z-20 border-b border-l bg-gray-50 pb-2.5 align-top"
            >
              <div className="flex flex-col items-center gap-2.5">
                {option.type === "timeSlot" ? (
                  <TimeRange
                    start={option.startTime}
                    end={option.endTime}
                    duration={option.duration}
                  />
                ) : null}
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
