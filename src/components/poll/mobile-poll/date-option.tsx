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
      <div className="grow">
        <div className="flex grow items-center text-sm text-slate-400">
          {dow}
        </div>
        <div className="h-7 text-xl font-bold">{day}</div>
      </div>
    </PollOption>
  );
};

export default DateOption;
