import * as React from "react";

import DateCard from "../../date-card";
import PollOption, { PollOptionProps } from "./poll-option";

export interface DateOptionProps extends PollOptionProps {
  dow: string;
  day: string;
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
      <DateCard day={day} month={dow} />
    </PollOption>
  );
};

export default DateOption;
