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

export function TimeDisplay({ date, format = "HH:mm" }: DateDisplayProps) {
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
