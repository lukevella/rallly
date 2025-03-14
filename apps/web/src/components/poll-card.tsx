"use client";

import dayjs from "dayjs";
import Link from "next/link";
import { CalendarIcon, ClockIcon, ArrowRightIcon } from "lucide-react";
import { GroupPollIcon } from "@/app/[locale]/(admin)/app-card";
import { cn } from "@rallly/ui";

export function PollCard({
  pollId,
  title,
  createdAt,
  from,
  to,
  participants,
}: {
  pollId: string;
  title: string;
  createdAt: Date;
  from: Date;
  to: Date;
  participants: number;
}) {
  // Calculate duration in days
  const durationDays = dayjs(to).diff(dayjs(from), "day") + 1;

  return (
    <div key={pollId} className="relative flex justify-between">
      <div className="flex items-center gap-4">
        <DateRangeIcon fromDate={from} toDate={to} />
        <div>
          <div className="font-medium">
            <Link href={`/poll/${pollId}`}>
              <span className="absolute inset-0" />
              {title}
            </Link>
          </div>
          <div className="text-muted-foreground text-sm">
            {participants} {participants === 1 ? "participant" : "participants"}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2"></div>
    </div>
  );
}

interface DateIconProps {
  date: Date;
  className?: string;
  isStacked?: boolean;
}

function DateIcon({ date, className = "", isStacked = false }: DateIconProps) {
  const month = dayjs(date).format("MMM");
  const day = dayjs(date).format("D");
  const year = dayjs(date).format("YYYY");

  return (
    <div
      className={`bg-background flex flex-col items-center rounded-lg p-1 ring-2 ring-gray-200 ${className}`}
    >
      <div
        className={`text-muted-foreground flex items-center justify-center text-xs ${
          isStacked ? "opacity-90" : ""
        }`}
      >
        {month} {year !== dayjs().format("YYYY") ? `'${year.slice(2)}` : ""}
      </div>
      <div
        className={`flex w-10 items-center justify-center rounded-md text-base font-bold ${
          isStacked ? "opacity-90" : ""
        }`}
      >
        {day}
      </div>
    </div>
  );
}

interface DateRangeIconProps {
  fromDate: Date;
  toDate: Date;
  className?: string;
}

function DateRangeIcon({
  fromDate,
  toDate,
  className = "",
}: DateRangeIconProps) {
  // Calculate number of days between dates to determine stack size
  const daysBetween = dayjs(toDate).diff(dayjs(fromDate), "day");
  const showMiddleStack = daysBetween > 1;

  return (
    <div className={cn("relative", className)}>
      {/* Front date (first date) */}
      <div style={{ zIndex: 3 }}>
        <DateIcon date={fromDate} />
      </div>
    </div>
  );
}
