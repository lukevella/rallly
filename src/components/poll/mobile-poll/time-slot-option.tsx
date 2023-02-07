import * as React from "react";

import Clock from "@/components/icons/clock.svg";

import PollOption, { PollOptionProps } from "./poll-option";

export interface TimeSlotOptionProps extends PollOptionProps {
  startTime: string;
  endTime: string;
  duration: string;
}

const TimeSlotOption: React.VoidFunctionComponent<TimeSlotOptionProps> = ({
  startTime,
  duration,
  ...rest
}) => {
  return (
    <PollOption {...rest}>
      <div className="grow">
        <div className="h-7">{`${startTime}`}</div>
        <div className="flex grow items-center text-sm text-slate-400">
          <Clock className="leading- mr-1 inline w-4" />
          {duration}
        </div>
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
