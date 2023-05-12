import { ClockIcon } from "@rallly/icons";
import * as React from "react";

import PollOption, { PollOptionProps } from "./poll-option";

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
      <div className="grow">
        <div className="h-7">{`${startTime}`}</div>
        <div className="flex grow items-center text-sm text-gray-500">
          <ClockIcon className="leading- mr-1 inline w-4" />
          {duration}
        </div>
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
