import clsx from "clsx";
import * as React from "react";

import DateCard from "@/components/date-card";
import { usePoll } from "@/components/poll-context";

import ControlledScrollArea from "./controlled-scroll-area";
import { usePollContext } from "./poll-context";
import Score from "./score";

const TimeRange: React.VoidFunctionComponent<{
  startTime: string;
  endTime: string;
  className?: string;
}> = ({ startTime, endTime, className }) => {
  return (
    <div
      className={clsx(
        "relative inline-block pr-2 text-right text-xs font-semibold after:absolute after:top-2 after:right-0 after:h-4 after:w-1 after:border-t after:border-r after:border-b after:border-slate-300 after:content-['']",
        className,
      )}
    >
      <div>{startTime}</div>
      <div className="text-slate-400">{endTime}</div>
    </div>
  );
};

const PollHeader: React.VoidFunctionComponent = () => {
  const { options, getParticipantsWhoVotedForOption, highScore } = usePoll();
  const { activeOptionId, setActiveOptionId, columnWidth } = usePollContext();

  return (
    <ControlledScrollArea>
      {options.map((option) => {
        const { optionId } = option;
        const numVotes = getParticipantsWhoVotedForOption(optionId).length;
        return (
          <div
            key={optionId}
            className={clsx(
              "shrink-0 pt-4 pb-3 text-center transition-colors",
              {
                "bg-slate-50": activeOptionId === optionId,
              },
            )}
            style={{ width: columnWidth }}
            onMouseOver={() => setActiveOptionId(optionId)}
            onMouseOut={() => setActiveOptionId(null)}
          >
            <div>
              <DateCard
                day={option.day}
                dow={option.dow}
                month={option.month}
                annotation={
                  numVotes > 0 ? (
                    <Score
                      count={numVotes}
                      highlight={numVotes > 1 && highScore === numVotes}
                    />
                  ) : null
                }
              />
            </div>
            {option.type === "timeSlot" ? (
              <TimeRange
                className="mt-3"
                startTime={option.startTime}
                endTime={option.endTime}
              />
            ) : null}
          </div>
        );
      })}
    </ControlledScrollArea>
  );
};

export default PollHeader;
