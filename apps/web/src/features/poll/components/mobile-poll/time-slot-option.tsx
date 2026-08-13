import type * as React from "react";

import type { PollOptionProps } from "./poll-option";
import PollOption from "./poll-option";

export interface TimeSlotOptionProps extends PollOptionProps {
  startTime: string;
  endTime: string;
  duration: string;
}

const meridiem = (time: string) => /(AM|PM)$/.exec(time)?.[0];

const TimeSlotOption: React.FunctionComponent<TimeSlotOptionProps> = ({
  startTime,
  endTime,
  ...rest
}) => {
  // "12:00 – 1:00 PM" reads cleaner than repeating the period; keep it when
  // the range crosses noon ("11:00 AM – 1:00 PM") or the locale has none.
  const startLabel =
    meridiem(startTime) && meridiem(startTime) === meridiem(endTime)
      ? startTime.replace(/ (AM|PM)$/, "")
      : startTime;

  return (
    <PollOption {...rest}>
      <div className="text-sm">
        {startLabel} – {endTime}
      </div>
    </PollOption>
  );
};

export default TimeSlotOption;
