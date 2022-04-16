import clsx from "clsx";
import * as React from "react";

export interface DateCardProps {
  annotation?: React.ReactNode;
  day: string;
  month: string;
  dow: string;
  className?: string;
}

const DateCard: React.VoidFunctionComponent<DateCardProps> = ({
  annotation,
  className,
  day,
  dow,
  month,
}) => {
  return (
    <div
      className={clsx(
        "relative inline-block h-14 w-14 rounded-md border bg-white text-center shadow-md shadow-slate-100",
        className,
      )}
    >
      {annotation ? (
        <div className="absolute -top-3 -right-3">{annotation}</div>
      ) : null}
      <div className="relative -mt-2 mb-[-1px] text-xs text-slate-400">
        <span className="relative z-10 inline-block px-1 after:absolute after:left-0 after:top-[7px] after:-z-10 after:inline-block after:w-full after:border-t after:border-white after:content-['']">
          {dow}
        </span>
      </div>
      <div className="-mb-1 text-center text-lg text-red-500">{day}</div>
      <div className="text-center text-xs font-semibold uppercase text-gray-800">
        {month}
      </div>
    </div>
  );
};

export default DateCard;
