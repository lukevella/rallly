import { cn } from "@rallly/ui";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";

export const DateIconInner = (props: {
  dow?: React.ReactNode;
  day?: React.ReactNode;
  month?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "inline-flex size-10 flex-col overflow-hidden rounded-md border bg-gray-50 text-center text-slate-800",
        props.className,
      )}
    >
      <div className="border-gray-200 border-b font-normal text-muted-foreground text-xs leading-4">
        {props.dow}
      </div>
      <div className="flex grow items-center justify-center bg-white font-medium text-sm leading-none tracking-tight">
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
