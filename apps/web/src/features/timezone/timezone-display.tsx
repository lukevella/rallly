"use client";

import type dayjs from "dayjs";

import { useTimezone } from "./timezone-context";

type DateDisplayProps = {
  date: string | Date | dayjs.Dayjs;
  format?: string;
};

export function DateDisplay({ date, format = "LL" }: DateDisplayProps) {
  const { formatDate } = useTimezone();
  return <span>{formatDate(date, format)}</span>;
}

export function TimeDisplay({ date, format = "LT" }: DateDisplayProps) {
  const { formatTime } = useTimezone();
  return <span>{formatTime(date, format)}</span>;
}

export function DateTimeDisplay({ date, format = "LL, LT" }: DateDisplayProps) {
  const { formatDateTime } = useTimezone();
  return <span>{formatDateTime(date, format)}</span>;
}

// Component to display the current timezone
export function CurrentTimezone() {
  const { timezone } = useTimezone();
  return <span>{timezone}</span>;
}

export function TimeRangeDisplay({
  start,
  end,
  format = "LT",
}: {
  start: string | Date | dayjs.Dayjs;
  end: string | Date | dayjs.Dayjs;
  format?: string;
}) {
  const { formatTime } = useTimezone();
  return (
    <span>
      {formatTime(start, format)}
      {" - "}
      {formatTime(end, format)}
    </span>
  );
}

export function DateIcon({ date }: { date: string | Date | dayjs.Dayjs }) {
  const { formatDate } = useTimezone();
  return (
    <div className="inline-flex size-12 flex-col overflow-hidden rounded-lg border bg-white text-center leading-none shadow-sm">
      <div className="text-muted-foreground border-b bg-gray-50 py-1 text-[10px] font-medium uppercase">
        {formatDate(date, "MMM")}
      </div>
      <div className="flex flex-1 items-center justify-center text-sm font-semibold leading-none">
        {formatDate(date, "D")}
      </div>
    </div>
  );
}
