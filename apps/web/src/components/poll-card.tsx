"use client";

import { cn } from "@rallly/ui";
import dayjs from "dayjs";
import Link from "next/link";

export function PollCard({
  pollId,
  title,
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

  return (
    <div
      className={`bg-background flex flex-col items-center rounded-lg border p-1 ${className}`}
    >
      <div
        className={`text-muted-foreground flex items-center justify-center text-xs ${
          isStacked ? "opacity-90" : ""
        }`}
      >
        {month}
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

function DateRangeIcon({ fromDate, className = "" }: DateRangeIconProps) {
  return (
    <div className={cn("relative", className)}>
      {/* Front date (first date) */}
      <div style={{ zIndex: 3 }}>
        <DateIcon date={fromDate} />
      </div>
    </div>
  );
}
