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
      <div className="contents text-sm">
        <div>{startTime}</div>
        <div className="justify-self-end text-muted-foreground">{duration}</div>
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
