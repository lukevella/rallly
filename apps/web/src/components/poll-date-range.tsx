"use client";

import dayjs from "dayjs";
import { useTimezone } from "@/features/timezone";

interface PollDateRangeProps {
  startDate: Date;
  endDate: Date;
  className?: string;
}

export function PollDateRange({
  startDate,
  endDate,
  className,
}: PollDateRangeProps) {
  const { timezone } = useTimezone();
  const startDay = dayjs(startDate).tz(timezone);
  const endDay = dayjs(endDate).tz(timezone);
  const isSameDay = startDay.isSame(endDay, "day");

  let formattedRange: string;
  if (isSameDay) {
    formattedRange = startDay.format("MMM D, YYYY");
  } else {
    const startYear = startDay.year();
    const endYear = endDay.year();

    if (startYear === endYear) {
      formattedRange = `${startDay.format("MMM D")} - ${endDay.format("MMM D, YYYY")}`;
    } else {
      formattedRange = `${startDay.format("MMM D, YYYY")} - ${endDay.format("MMM D, YYYY")}`;
    }
  }

  return <div className={className}>{formattedRange}</div>;
}
