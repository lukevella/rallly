import { ClockIcon } from "lucide-react";
import type * as React from "react";

import type { PollOptionProps } from "./poll-option";
import PollOption from "./poll-option";

export interface TimeSlotOptionProps extends PollOptionProps {
  startTime: string;
  endTime: string;
  duration: string;
}

const TimeSlotOption: React.FunctionComponent<TimeSlotOptionProps> = ({
  startTime,
  duration,
  ...rest
}) => {
  return (
    <PollOption {...rest}>
      <div className="flex min-w-0 items-center gap-x-2 text-sm sm:gap-x-4">
        <div className="shrink-0">{startTime}</div>
        <div className="flex min-w-0 items-center gap-x-1 opacity-50 sm:gap-x-1.5">
          <ClockIcon className="size-4 shrink-0" />
          <span className="truncate">{duration}</span>
        </div>
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
