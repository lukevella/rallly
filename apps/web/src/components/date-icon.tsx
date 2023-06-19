import clsx from "clsx";
import dayjs, { Dayjs } from "dayjs";

export const DateIconInner = (props: {
  dow?: React.ReactNode;
  day?: React.ReactNode;
  month?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={clsx(
        "w-14 overflow-hidden rounded-md border bg-white text-center text-slate-800",
        props.className,
      )}
    >
      <div className="h-4 border-b border-slate-200 bg-slate-50 text-xs leading-4">
        {props.dow}
      </div>
      <div className="flex h-10 items-center justify-center">
        <div>
          <div className="my-px text-lg font-bold leading-none">
            {props.day}
          </div>
          <div className="text-xs font-bold uppercase tracking-wider">
            {props.month}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DateIcon = (props: { date: Dayjs; className?: string }) => {
  return (
    <DateIconInner
      className={props.className}
      dow={dayjs(props.date).format("ddd")}
      day={dayjs(props.date).format("D")}
      month={dayjs(props.date).format("MMM")}
    />
  );
};
