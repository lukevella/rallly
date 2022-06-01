import clsx from "clsx";
import * as React from "react";

import { usePoll } from "@/components/poll-context";

import { ScoreSummary } from "../score-summary";
import ControlledScrollArea from "./controlled-scroll-area";
import { usePollContext } from "./poll-context";

const TimeRange: React.VoidFunctionComponent<{
  startTime: string;
  endTime: string;
  className?: string;
}> = ({ startTime, endTime, className }) => {
  return (
    <div
      className={clsx(
        "relative -mr-2 inline-block pr-2 text-right text-xs font-semibold after:absolute after:top-2 after:right-0 after:h-4 after:w-1 after:border-t after:border-r after:border-b after:border-slate-300 after:content-['']",
        className,
      )}
    >
      <div>{startTime}</div>
      <div className="text-slate-400">{endTime}</div>
    </div>
  );
};

const PollHeader: React.VoidFunctionComponent = () => {
  const { options, getScore } = usePoll();
  const { activeOptionId, setActiveOptionId, columnWidth } = usePollContext();

  return (
    <ControlledScrollArea>
      {options.map((option) => {
        const { optionId } = option;
        const numVotes = getScore(optionId);
        return (
          <div
            key={optionId}
            className={clsx(
              "shrink-0 space-y-3 py-3 text-center transition-colors",
              {
                "bg-gray-50": activeOptionId === optionId,
              },
            )}
            style={{ width: columnWidth }}
            onMouseOver={() => setActiveOptionId(optionId)}
            onMouseOut={() => setActiveOptionId(null)}
          >
            <div>
              <div className="font-semibold leading-9">
                <div className="text-sm uppercase text-slate-400">
                  {option.dow}
                </div>
                <div className="text-2xl">{option.day}</div>
                <div className="text-xs font-medium uppercase text-slate-400/75">
                  {option.month}
                </div>
              </div>
            </div>
            {option.type === "timeSlot" ? (
              <TimeRange
                className="mt-3"
                startTime={option.startTime}
                endTime={option.endTime}
              />
            ) : null}
            <div className="flex justify-center">
              <ScoreSummary
                yesScore={numVotes.yes}
                ifNeedBeScore={numVotes.ifNeedBe}
              />
            </div>
          </div>
        );
      })}
    </ControlledScrollArea>
  );
};

export default PollHeader;
