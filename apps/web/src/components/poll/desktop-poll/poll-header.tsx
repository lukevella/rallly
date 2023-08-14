import { cn } from "@rallly/ui";
import clsx from "clsx";
import * as React from "react";

import { DateIconInner } from "@/components/date-icon";
import { useOptions } from "@/components/poll-context";

import { ConnectedScoreSummary } from "../score-summary";

const TimeRange: React.FunctionComponent<{
  start: string;
  end: string;
  className?: string;
}> = ({ start, end, className }) => {
  return (
    <div
      className={clsx(
        "relative -mr-2 inline-block whitespace-nowrap pr-2 text-right text-xs font-normal after:absolute after:right-0 after:top-2 after:h-4 after:w-1 after:border-b after:border-r after:border-t after:border-gray-300 after:content-['']",
        className,
      )}
    >
      <div className="font-medium tabular-nums">{start}</div>
      <div className="text-muted-foreground tabular-nums">{end}</div>
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
      <th className="w-full" />
    </tr>
  );
};

const monthRowHeight = 48;
const dayRowHeight = 64;

const scoreRowTop = monthRowHeight + dayRowHeight;

const Trail = ({ end }: { end?: boolean }) => {
  return end ? (
    <div aria-hidden="true" className="absolute top-6 left-0 z-10 h-full w-1/2">
      <div className="h-px bg-gray-200" />
      <div className="absolute right-0 top-0 h-5 w-px bg-gray-200" />
    </div>
  ) : (
    <div
      aria-hidden="true"
      className={cn("absolute top-6 left-0 z-10 h-full w-full")}
    >
      <div className="h-px bg-gray-200" />
      <div className={cn("absolute right-1/2 top-0 h-2 w-px bg-gray-200")} />
    </div>
  );
};

const PollHeader: React.FunctionComponent = () => {
  const { options } = useOptions();
  return (
    <>
      <TimelineRow top={0}>
        {options.map((option, i) => {
          const firstOfMonth =
            i === 0 || options[i - 1]?.month !== option.month;
          const lastOfMonth = options[i + 1]?.month !== option.month;

          return (
            <th
              key={option.optionId}
              style={{ height: monthRowHeight }}
              className={cn(
                "sticky top-0 space-y-3 bg-white",
                firstOfMonth ? "left-[240px] z-20" : "z-10",
              )}
            >
              <div className="flex items-center justify-center">
                {firstOfMonth ? null : <Trail end={lastOfMonth} />}
                <div
                  className={cn(
                    "h-5 px-2 py-0.5 text-sm font-semibold",
                    firstOfMonth ? "opacity-100" : "opacity-0",
                  )}
                >
                  {option.month}
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
            options[i + 1]?.day !== option.day ||
            options[i + 1]?.month !== option.month;
          return (
            <th
              key={option.optionId}
              style={{
                minWidth: 80,
                width: 80,
                maxWidth: 90,
                height: dayRowHeight,
                // could enable this to make the date column sticky
                left: firstOfDay ? 240 : 0,
                top: monthRowHeight,
              }}
              className={cn(
                "sticky space-y-2 align-top",
                firstOfDay
                  ? "z-20 bg-gradient-to-r from-transparent to-white"
                  : "z-10 bg-white",
              )}
            >
              {firstOfDay ? null : <Trail end={lastOfDay} />}
              <DateIconInner
                className={firstOfDay ? "opacity-100" : "opacity-0"}
                day={option.day}
                dow={option.dow}
              />
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
              className="sticky z-20 space-y-2 bg-white py-2"
            >
              {option.type === "timeSlot" ? (
                <TimeRange start={option.startTime} end={option.endTime} />
              ) : null}
              <div>
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
