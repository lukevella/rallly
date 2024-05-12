import * as React from "react";

import PollOption, { PollOptionProps } from "./poll-option";

export interface DateOptionProps extends PollOptionProps {
  dow: string;
  day: string;
  month: string;
}

const DateOption: React.FunctionComponent<DateOptionProps> = ({
  dow,
  day,
  ...rest
}) => {
  return (
    <PollOption {...rest}>
      {/**
       * Intentionally using the month prop for the day of week here as a temporary measure
       * until we update this component.
       */}
      <div className="text-sm">
        <span className="font-semibold">
          {day} {dow}
        </span>
      </div>
    </PollOption>
  );
};

export default DateOption;
