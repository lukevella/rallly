import clsx from "clsx";
import * as React from "react";

import { usePoll } from "@/components/poll-context";

import DateCard from "../../date-card";
import { ConnectedScoreSummary } from "../score-summary";
import ControlledScrollArea from "./controlled-scroll-area";
import { usePollContext } from "./poll-context";

const TimeRange: React.FunctionComponent<{
  startTime: string;
  endTime: string;
  className?: string;
}> = ({ startTime, endTime, className }) => {
  return (
    <div
      className={clsx(
        "relative -mr-2 inline-block pr-2 text-right text-xs font-semibold after:absolute after:right-0 after:top-2 after:h-4 after:w-1 after:border-b after:border-r after:border-t after:border-gray-300 after:content-['']",
        className,
      )}
    >
      <div>{startTime}</div>
      <div className="text-gray-500">{endTime}</div>
    </div>
  );
};

const PollHeader: React.FunctionComponent = () => {
  const { options } = usePoll();
  const { setActiveOptionId, columnWidth } = usePollContext();

  return (
    <ControlledScrollArea>
      {options.map((option) => {
        const { optionId } = option;
        return (
          <div
            key={optionId}
            className="shrink-0 space-y-3 text-center"
            style={{ width: columnWidth }}
            onMouseOver={() => setActiveOptionId(optionId)}
            onMouseOut={() => setActiveOptionId(null)}
          >
            <div>
              <DateCard
                day={option.day}
                dow={option.dow}
                month={option.month}
              />
            </div>
            {option.type === "timeSlot" ? (
              <TimeRange
                className="mt-3"
                startTime={option.startTime}
                endTime={option.endTime}
              />
            ) : null}
            <div className="flex justify-center">
              <ConnectedScoreSummary optionId={option.optionId} />
            </div>
          </div>
        );
      })}
    </ControlledScrollArea>
  );
};

export default PollHeader;
