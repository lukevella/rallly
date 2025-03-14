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
      <div className="flex min-w-0 items-center gap-4">
        <DateRangeIcon fromDate={from} toDate={to} />
        <div className="min-w-0">
          <div className="truncate text-base tracking-tight">
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
      className={cn(
        "bg-background flex size-12 flex-col items-center justify-center rounded-lg border",
        className,
      )}
    >
      <div
        className={cn(
          "text-muted-foreground flex items-center justify-center text-xs",
          {
            "opacity-90": isStacked,
          },
        )}
      >
        {month}
      </div>
      <div
        className={cn("flex items-center justify-center rounded-md text-base", {
          "opacity-90": isStacked,
        })}
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
  return (
    <div className={cn("relative isolate", className)}>
      {/* Back date (second date) */}
      <div className="relative z-20">
        <DateIcon date={toDate} isStacked={true} />
      </div>
      {/* Front date (first date) */}
      <div className="absolute -bottom-1 z-10">
        <DateIcon date={fromDate} />
      </div>
    </div>
  );
}
