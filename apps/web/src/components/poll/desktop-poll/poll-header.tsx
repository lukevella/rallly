import { cn } from "@rallly/ui";
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
import { Trans } from "@/components/trans";

const TimeRange: React.FunctionComponent<{
  start: string;
  end: string;
  duration: string;
  className?: string;
}> = ({ start, end, duration, className }) => {
  return (
    <div
      className={cn(
        "text-muted-foreground relative flex flex-col items-center gap-1.5 text-xs font-normal",
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
        style={{ minWidth: 240, top }}
        className="sticky left-0 z-30 bg-white pl-4 pr-4"
      ></th>
      {children}
      <th className="bg-diagonal-lines -ml-4 w-full min-w-4 border-l" />
    </tr>
  );
};

const monthRowHeight = 48;
const dayRowHeight = 60;

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
                "sticky top-0 space-y-3 bg-gray-50",
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

          const lastOfDay =
            i === options.length - 1 || options[i + 1]?.day !== option.day;
          return (
            <th
              key={option.optionId}
              style={{
                minWidth: 80,
                width: 80,
                height: dayRowHeight,
                left: firstOfDay && !lastOfDay ? 240 : 0,
                top: monthRowHeight,
              }}
              className={cn(
                "sticky space-y-2 border-t bg-gray-50",
                firstOfDay ? "z-20" : "z-10",
                {
                  "border-l": firstOfDay,
                },
              )}
            >
              {firstOfDay ? (
                <div className="mt-1 flex flex-col gap-1">
                  <div className="text-muted-foreground text-xs font-normal">
                    {option.dow}
                  </div>
                  <div className="text-sm font-medium">{option.day}</div>
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
              className="sticky z-20 border-l bg-gray-50 pb-2.5 align-top"
            >
              <div className="flex flex-col items-center gap-3">
                {option.type === "timeSlot" ? (
                  <TimeRange
                    start={option.startTime}
                    end={option.endTime}
                    duration={option.duration}
                  />
                ) : (
                  <p className="text-muted-foreground text-xs font-normal opacity-50">
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
