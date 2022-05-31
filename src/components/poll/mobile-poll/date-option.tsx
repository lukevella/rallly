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
      <div className="font-semibold leading-9">
        <span className="text-2xl">{day}</span>
        &nbsp;
        <span className="text-sm uppercase text-slate-400">{dow}</span>
      </div>
    </PollOption>
  );
};

export default DateOption;
