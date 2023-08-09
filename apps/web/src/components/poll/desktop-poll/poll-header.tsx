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
        "relative -mr-2 inline-block pr-2 text-right text-xs font-semibold after:absolute after:right-0 after:top-2 after:h-4 after:w-1 after:border-b after:border-r after:border-t after:border-gray-300 after:content-['']",
        className,
      )}
    >
      <div>{start}</div>
      <div className="text-gray-500">{end}</div>
    </div>
  );
};

const PollHeader: React.FunctionComponent = () => {
  const { options } = useOptions();
  return (
    <>
      {options.map((option) => {
        return (
          <th
            key={option.optionId}
            className="sticky top-0 z-20 space-y-3 bg-white"
            style={{ minWidth: 80, maxWidth: 90 }}
          >
            <div className="flex flex-col items-center gap-2.5 py-3">
              <DateIconInner
                day={option.day}
                dow={option.dow}
                month={option.month}
              />
              {option.type === "timeSlot" ? (
                <TimeRange start={option.startTime} end={option.endTime} />
              ) : null}
              <ConnectedScoreSummary optionId={option.optionId} />
            </div>
          </th>
        );
      })}
    </>
  );
};

export default PollHeader;
