"use client";

import { dayjs } from "@/lib/dayjs";

export function RelativeDate({ date }: { date: Date }) {
  return <>{dayjs(date).fromNow()}</>;
}
