"use client";

import { cn } from "@rallly/ui";
import dayjs from "dayjs";
import { MapPinIcon } from "lucide-react";
import Link from "next/link";

import { OptimizedAvatarImage } from "./optimized-avatar-image";

export function PollCard({
  pollId,
  title,
  from,
  to,
  participants,
  location,
  optionsCount,
  participantsList,
}: {
  pollId: string;
  title: string;
  createdAt: Date;
  from: Date;
  to: Date;
  participants: number;
  location: string | null;
  optionsCount: number;
  participantsList: {
    id: string;
    name: string;
    user: {
      image: string | null;
    } | null;
  }[];
}) {
  // Format dates
  const fromFormatted = dayjs(from).format("MMM D");
  const toFormatted = dayjs(to).format("MMM D");

  return (
    <div
      key={pollId}
      className="relative flex flex-col gap-2 rounded-lg border p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="min-w-0">
        <div className="truncate text-base font-medium tracking-tight">
          <Link href={`/poll/${pollId}`}>
            <span className="absolute inset-0" />
            {title}
          </Link>
        </div>

        {location && (
          <div className="text-muted-foreground mt-1 flex items-center gap-1 text-sm">
            <MapPinIcon className="h-3.5 w-3.5" />
            <span className="truncate">{location}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DateRangeIcon fromDate={from} toDate={to} />
          <div className="text-muted-foreground text-sm">
            {fromFormatted} - {toFormatted}
            {optionsCount > 1 && (
              <span className="ml-1 text-xs">({optionsCount} options)</span>
            )}
          </div>
        </div>

        <div className="flex items-center">
          <div className="flex -space-x-2">
            {participantsList.slice(0, 5).map((participant) => (
              <div key={participant.id} className="relative">
                <OptimizedAvatarImage
                  src={participant.user?.image ?? undefined}
                  name={participant.name}
                  size="sm"
                  className="border-background border-2"
                />
              </div>
            ))}
          </div>
          {participants > 5 && (
            <div className="text-muted-foreground ml-1 text-xs">
              +{participants - 5}
            </div>
          )}
        </div>
      </div>
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
        "bg-background flex size-10 flex-col items-center justify-center rounded-lg border",
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
        className={cn(
          "flex items-center justify-center rounded-md text-sm font-medium",
          {
            "opacity-90": isStacked,
          },
        )}
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
