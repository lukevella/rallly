import clsx from "clsx";
import dayjs, { Dayjs } from "dayjs";

export const DateIconInner = (props: {
  dow?: React.ReactNode;
  day?: React.ReactNode;
  month?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className="inline-block text-center">
      <div
        className={clsx(
          "inline-block w-12 overflow-hidden rounded-md border bg-gray-50 text-center text-slate-800",
          props.className,
        )}
      >
        <div className="text-muted-foreground border-b border-gray-200 text-xs font-normal leading-5">
          {props.dow}
        </div>
        <div className="flex h-8 items-center justify-center bg-white">
          <div>
            <div className="my-px text-lg font-semibold leading-none tracking-tight">
              {props.day}
            </div>
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
