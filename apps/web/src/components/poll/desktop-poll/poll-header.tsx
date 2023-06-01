import clsx from "clsx";
import dayjs, { Dayjs } from "dayjs";
import * as React from "react";

import { DateIcon } from "@/components/date-icon";
import {
  TimeFormatter,
  useAdjustTimeZone,
  usePoll,
} from "@/components/poll-context";

import { ConnectedScoreSummary } from "../score-summary";
import ControlledScrollArea from "./controlled-scroll-area";
import { usePollContext } from "./poll-context";

const TimeRange: React.FunctionComponent<{
  start: Dayjs;
  duration: number;
  className?: string;
}> = ({ start, duration, className }) => {
  return (
    <div
      className={clsx(
        "relative -mr-2 inline-block pr-2 text-right text-xs font-semibold after:absolute after:right-0 after:top-2 after:h-4 after:w-1 after:border-b after:border-r after:border-t after:border-gray-300 after:content-['']",
        className,
      )}
    >
      <div>
        <TimeFormatter date={start} />
      </div>
      <div className="text-gray-500">
        <TimeFormatter date={dayjs(start).add(duration, "minutes").toDate()} />
      </div>
    </div>
  );
};

const PollHeader: React.FunctionComponent = () => {
  const { poll } = usePoll();
  const { setActiveOptionId, columnWidth } = usePollContext();
  const tz = useAdjustTimeZone();
  return (
    <ControlledScrollArea>
      {poll.options.map((option) => {
        const date = tz(option.start);
        return (
          <div
            key={option.id}
            className="flex shrink-0 flex-col items-center gap-y-3"
            style={{ width: columnWidth }}
            onMouseOver={() => setActiveOptionId(option.id)}
            onMouseOut={() => setActiveOptionId(null)}
          >
            <DateIcon date={date} />
            {option.duration > 0 ? (
              <TimeRange start={date} duration={option.duration} />
            ) : null}
            <div className="flex justify-center">
              <ConnectedScoreSummary optionId={option.id} />
            </div>
          </div>
        );
      })}
    </ControlledScrollArea>
  );
};

export default PollHeader;
