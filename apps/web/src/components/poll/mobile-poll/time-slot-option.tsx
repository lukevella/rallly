import { cn } from "@rallly/ui";
import { Icon } from "@rallly/ui/icon";
import { ClockIcon } from "lucide-react";
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
      <div className="flex items-center gap-x-4 text-sm">
        <div>{startTime}</div>
        <div
          className={cn(
            "flex items-center gap-x-1.5 whitespace-nowrap opacity-50",
            "xs:flex",
          )}
        >
          <Icon>
            <ClockIcon />
          </Icon>
          {duration}
        </div>
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
