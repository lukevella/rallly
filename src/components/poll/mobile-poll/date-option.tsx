import * as React from "react";

import DateCard from "@/components/date-card";

import PollOption, { PollOptionProps } from "./poll-option";

export interface DateOptionProps extends PollOptionProps {
  dow: string;
  day: string;
  month: string;
}

const DateOption: React.VoidFunctionComponent<DateOptionProps> = ({
  dow,
  day,
  month,
  ...rest
}) => {
  return (
    <PollOption {...rest}>
      <DateCard dow={dow} day={day} month={month} />
    </PollOption>
  );
};

export default DateOption;
