import * as React from "react";

import { DateIconInner } from "@/components/date-icon";

import PollOption, { PollOptionProps } from "./poll-option";

export interface DateOptionProps extends PollOptionProps {
  dow: string;
  day: string;
  month: string;
}

const DateOption: React.FunctionComponent<DateOptionProps> = ({
  dow,
  day,
  month,
  ...rest
}) => {
  return (
    <PollOption {...rest}>
      {/**
       * Intentionally using the month prop for the day of week here as a temporary measure
       * until we update this component.
       */}
      <DateIconInner day={day} dow={dow} month={month} />
    </PollOption>
  );
};

export default DateOption;
