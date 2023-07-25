import clsx from "clsx";
import * as React from "react";

import { DateIconInner } from "@/components/date-icon";
import { useOptions } from "@/components/poll-context";

import { ConnectedScoreSummary } from "../score-summary";
import ControlledScrollArea from "./controlled-scroll-area";
import { usePollContext } from "./poll-context";

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
  const { setActiveOptionId, columnWidth } = usePollContext();
  return (
    <ControlledScrollArea>
      {options.map((option) => {
        return (
          <div
            key={option.optionId}
            className="flex shrink-0 flex-col items-center gap-y-3"
            style={{ width: columnWidth }}
            onMouseOver={() => setActiveOptionId(option.optionId)}
            onMouseOut={() => setActiveOptionId(null)}
          >
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
        );
      })}
    </ControlledScrollArea>
  );
};

export default PollHeader;
