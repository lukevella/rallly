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
        "inline-flex size-12 flex-col overflow-hidden rounded-md border bg-gray-50 text-center text-slate-800",
        props.className,
      )}
    >
      <div className="text-muted-foreground border-b border-gray-200 text-xs font-normal leading-4">
        {props.dow}
      </div>
      <div className="flex grow items-center justify-center bg-white text-lg font-semibold leading-none tracking-tight">
        {props.day}
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
