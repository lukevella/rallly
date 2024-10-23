import { ClockIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@rallly/ui";
import PollOption, { PollOptionProps } from "./poll-option";

export interface TimeSlotOptionProps extends PollOptionProps {
  startTime: string;
  endTime: string;
  duration: string;
}

const TimeSlotOption: React.FunctionComponent<TimeSlotOptionProps> = ({
  startTime,
  endTime,
  duration,
  ...rest
}) => {
  const showVotes = !!(rest.selectedParticipantId || rest.editable);

  return (
    <PollOption {...rest}>
      <div className="flex items-center gap-x-4 text-sm">
        <div>{`${startTime} - ${endTime}`}</div>
        <div
          className={cn(
            "flex items-center gap-x-1.5 opacity-50",
            { hidden: showVotes },
            "xs:flex",
          )}
        >
          <ClockIcon className="size-4" />
          {duration}
        </div>
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
