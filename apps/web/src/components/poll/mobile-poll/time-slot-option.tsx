import { ClockIcon } from "lucide-react";
import * as React from "react";

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
      <div className="flex items-center gap-x-4 text-sm">
        <div>{startTime}</div>
        <div className="flex items-center gap-x-1.5 opacity-50">
          <ClockIcon className="size-4" />
          {duration}
        </div>
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
