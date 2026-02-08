import { cn } from "@rallly/ui";
import type { Dayjs } from "dayjs";

import { dayjs } from "@/lib/dayjs";

export const DateIconInner = (props: {
  dow?: React.ReactNode;
  day?: React.ReactNode;
  month?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "inline-flex size-10 flex-col overflow-hidden rounded-md border bg-card text-center text-card-foreground",
        props.className,
      )}
    >
      <div className="font-normal text-[10px] text-muted-foreground leading-4">
        {props.dow}
      </div>
      <div className="flex grow items-center justify-center font-medium text-sm leading-none tracking-tight">
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
