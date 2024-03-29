import { cn } from "@rallly/ui";
import { Tooltip, TooltipContent, TooltipTrigger } from "@rallly/ui/tooltip";
import * as React from "react";

import { ConnectedScoreSummary } from "@/components/poll/score-summary";
import { useOptions } from "@/components/poll-context";
import { Trans } from "@/components/trans";

const TimeRange: React.FunctionComponent<{
  start: string;
  end: string;
  className?: string;
}> = ({ start, end, className }) => {
  return (
    <Tooltip>
      <TooltipTrigger
        className={cn("text-muted-foreground text-xs font-normal", className)}
      >
        {start}
      </TooltipTrigger>
      <TooltipContent className="font-normal">
        <Trans
          i18nKey="tillTime"
          defaults="till {{time}}"
          values={{ time: end }}
        />
      </TooltipContent>
    </Tooltip>
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
      <th className="-ml-4 w-full border-l" />
    </tr>
  );
};

const monthRowHeight = 48;
const dayRowHeight = 36;

const scoreRowTop = monthRowHeight + dayRowHeight;

const Trail = ({ end }: { end?: boolean }) => {
  return null;
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
                "sticky top-0 space-y-3 border-b bg-gray-50",
                firstOfMonth ? "left-[240px] z-20 border-l" : "z-10",
              )}
            >
              <div className="flex">
                {firstOfMonth ? null : <Trail end={lastOfMonth} />}
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
            options[i + 1]?.day !== option.day ||
            options[i + 1]?.month !== option.month;
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
                "sticky space-y-2 bg-gray-50 pt-2.5 align-top",
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
              ) : (
                <Trail end={lastOfDay} />
              )}
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
              className="z-20 border-b border-l bg-gray-50 pb-2 pt-2 align-top"
            >
              <div className="grid justify-center gap-1">
                {option.type === "timeSlot" ? (
                  <TimeRange start={option.startTime} end={option.endTime} />
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
