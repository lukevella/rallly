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
        "inline-block bg-white text-center border h-14 w-14 rounded-md relative shadow-md shadow-slate-100",
        className,
      )}
    >
      {annotation ? (
        <div className="absolute -top-3 -right-3">{annotation}</div>
      ) : null}
      <div className="text-xs -mt-2 mb-[-1px] text-slate-400 relative">
        <span className="relative inline-block after:content-[''] after:inline-block after:absolute after:left-0 px-1 after:top-[7px] after:border-white after:-z-10 z-10 after:border-t after:w-full">
          {dow}
        </span>
      </div>
      <div className="text-red-500 text-lg -mb-1 text-center">{day}</div>
      <div className="text-gray-800 text-center text-xs uppercase font-semibold">
        {month}
      </div>
    </div>
  );
};

export default DateCard;
