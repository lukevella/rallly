import * as React from "react";

import PollOption, { PollOptionProps } from "./poll-option";

export interface TimeSlotOptionProps extends PollOptionProps {
  startTime: string;
  endTime: string;
  duration: string;
}

const TimeSlotOption: React.FunctionComponent<TimeSlotOptionProps> = ({
  startTime,
  endTime,
  ...rest
}) => {
  return (
    <PollOption {...rest}>
      <div className="flex items-center gap-x-4 text-sm">
        <div>{`${startTime} - ${endTime}`}</div>
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
