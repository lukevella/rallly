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
      <div className="tabular-nums">{start}</div>
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
              className={cn(
                "sticky top-0 h-12 space-y-3 bg-white",
                firstOfMonth ? "left-[240px] z-20" : "z-10",
              )}
            >
              <div className="flex items-center justify-center">
                {firstOfMonth ? null : lastOfMonth ? (
                  <div
                    aria-hidden="true"
                    className="absolute top-6 left-0 w-1/2"
                  >
                    <div className="h-px bg-gray-200" />
                    <div className="absolute right-0 top-0 h-2 w-px bg-gray-100" />
                  </div>
                ) : (
                  <div className="absolute top-6 h-px w-full bg-gray-100" />
                )}
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
      <TimelineRow top={48}>
        {options.map((option) => {
          return (
            <th
              key={option.optionId}
              style={{ minWidth: 80, maxWidth: 90 }}
              className="sticky top-12 z-20 h-16 space-y-3 bg-white"
            >
              <DateIconInner day={option.day} dow={option.dow} />
              {option.type === "timeSlot" ? (
                <TimeRange start={option.startTime} end={option.endTime} />
              ) : null}
            </th>
          );
        })}
      </TimelineRow>
      <TimelineRow>
        {options.map((option) => {
          return (
            <th
              key={option.optionId}
              style={{ minWidth: 80, maxWidth: 90 }}
              className="bg-white pb-3 text-center"
            >
              <ConnectedScoreSummary optionId={option.optionId} />
            </th>
          );
        })}
      </TimelineRow>
    </>
  );
};

export default PollHeader;
