"use client";
import dayjs from "dayjs";

export function RelativeDate({ date }: { date: Date }) {
  return <>{dayjs(date).fromNow()}</>;
}
