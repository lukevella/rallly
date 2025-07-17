"use client";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { useTimezone } from "@/features/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

interface PollDateRangeProps {
  startDate: Date;
  endDate: Date;
  isFloating: boolean;
  className?: string;
}

export function PollDateRange({
  startDate,
  endDate,
  isFloating,
  className,
}: PollDateRangeProps) {
  const { timezone } = useTimezone();

  // For floating times, use the dates as-is (no timezone conversion)
  // For fixed times, convert to the user's timezone
  const startDay = isFloating
    ? dayjs(startDate)
    : dayjs(startDate).tz(timezone);

  const endDay = isFloating ? dayjs(endDate) : dayjs(endDate).tz(timezone);
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
