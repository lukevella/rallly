import { ClockIcon } from "lucide-react";
import * as React from "react";
import { createBreakpoint } from "react-use";
import PollOption, { PollOptionProps } from "./poll-option";

export interface TimeSlotOptionProps extends PollOptionProps {
  startTime: string;
  endTime: string;
  duration: string;
}

const useBreakpoint = createBreakpoint({
  hideDuration: 320,
  showDuration: 380,
});

const TimeSlotOption: React.FunctionComponent<TimeSlotOptionProps> = ({
  startTime,
  endTime,
  duration,
  ...rest
}) => {
  const breakpoint = useBreakpoint();
  const showVotes = !!(rest.selectedParticipantId || rest.editable);
  const showDuration =
    breakpoint === "showDuration" ||
    (breakpoint !== "showDuration" && !showVotes);

  return (
    <PollOption {...rest}>
      <div className="flex items-center gap-x-4 text-sm">
        <div>{`${startTime} - ${endTime}`}</div>
        {showDuration && (
          <div className="flex items-center gap-x-1.5 opacity-50">
            <ClockIcon className="size-4" />
            {duration}
          </div>
        )}
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
